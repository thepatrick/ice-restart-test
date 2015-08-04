'use strict';

var errorhandler = require('errorhandler');
var express      = require('express');
var http         = require('http');
var morgan       = require('morgan');
var path         = require('path');
var socketio     = require('socket.io');
var util         = require('util');

var port = process.env.PORT || 9094;

var app = express();
/* eslint new-cap: 0 */
var server = http.Server(app);
var io     = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(errorhandler());
app.use(morgan('dev'));

app.use(function(req, res) {
  res.status(404).send({ error: 'Not found' });
});

var restartConfig = {
  offerer:  undefined,
  answerer: undefined
};

function negotiate(iceRestart) {
  restartConfig.offerer.emit('createOffer', { iceRestart: iceRestart }, function(err, offerDesc) {
    if (err) {
      console.log('createOffer error: ', err);
      return;
    }

    console.log('createOffer: ' + offerDesc);
    restartConfig.answerer.emit('offer', offerDesc, function(err, answerDesc) {
      if (err) {
        console.log('offer error: ', err);
        return;
      }

      console.log('offer answer: ' + answerDesc);
      restartConfig.offerer.emit('answer', answerDesc);
    });
  });
}

io.on('connection', function(socket) {
  console.log('user connected', socket.id);

  socket.on('disconnect', function() {
    console.log('user disconnected', socket.id);
  });

  socket.on('restartCandidate', function(evt) {
    console.log('restartCandidate', evt);
    if (socket === restartConfig.offerer) {
      restartConfig.answerer.emit('restartCandidate', evt);
    } else if (socket === restartConfig.answerer) {
      restartConfig.offerer.emit('restartCandidate', evt);
    }
  });

  socket.on('restart', function() {
    if (!restartConfig.offerer) {
      console.log('This person is the offerer', socket.id);
      restartConfig.offerer = socket;
      socket.emit('restart you are', 'offerer');
    } else if (!restartConfig.answerer) {
      console.log('This person is the answerer', socket.id);
      restartConfig.answerer = socket;
      socket.emit('restart you are', 'answerer');
      negotiate(false);
    } else {
      console.log('Sorry, occupied');
    }
  });

  socket.on('restart reconnected', function(iAm) {
    console.log('Welcome back', iAm, '!', socket.id);
    restartConfig[iAm] = socket;
    negotiate(true);
  });
});

server.listen(port, function() {
  util.log('Up and running at http://localhost:' + port + '/');
});
