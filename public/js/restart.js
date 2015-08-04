'use strict';

/* global io, RTCPeerConnection */

/* eslint no-alert: 0 */

var socket = io();

var configuration = {
  iceServers: [
    {
      urls: ['stun:stun.ning.wizard.life'],
      url:  'stun:stun.ning.wizard.life'
    },
    {
      url:        'turn:stun.ning.wizard.life:3478?transport=udp',
      credential: 'donkeykong',
      username:   'patrick'
    },
    {
      urls:       ['turn:stun.ning.wizard.life:3478?transport=tcp'],
      url:        'turn:stun.ning.wizard.life:3478?transport=tcp',
      credential: 'donkeykong',
      username:   'patrick'
    }
  ]
};

var constraints = {
  optional: [
    { DtlsSrtpKeyAgreement: true }
  ]
};

var peerConnection = new RTCPeerConnection(configuration, constraints);

var serverSaysIAm, gumStream;

peerConnection.onicecandidate = function(evt) {
  if (evt.candidate) {
    console.log('» candidate', evt.candidate);
    socket.emit('restartCandidate', evt.candidate);
  }
};
peerConnection.oniceconnectionstatechange = function() {
  console.log('oniceconnectionstatechange', peerConnection.iceConnectionState);
};

peerConnection.onicegatheringstatechange = function() {
  console.log('onicegatheringstatechange', peerConnection.iceGatheringState);
};

peerConnection.onrenegotiationneeded = function(evt) {
  console.log('onrenegotiationneeded', evt);
};

peerConnection.onnegotiationneeded = function(evt) {
  console.log('onnegotiationneeded', evt);
};

peerConnection.onaddstream = function(evt) {
  var videoElement = document.createElement('video');
  document.body.appendChild(videoElement);
  videoElement.src = window.URL.createObjectURL(evt.stream);
  videoElement.setAttribute('pc-stream-id', evt.stream.id);
  videoElement.play();
};

peerConnection.onremovestream = function(evt) {
  var videoTag = document.querySelector('[pc-stream-id=' + evt.stream.id + ']');
  videoTag.parentNode.removeChild(videoTag);
};

function createOffer(options, cb) {
  // var dc = peerConnection.createDataChannel('myLabel', dataChannelOptions);
  // dataChannelEvents(dc);

  var offerConstraints = {};

  if (options.iceRestart) {
    offerConstraints.iceRestart = true;
  }

  console.log('createOffer with options:', offerConstraints);

  // peerConnection.createOffer(offerConstraints)
  //   .then(function(desc) {
  //     peerConnection.setLocalDescription(desc);
  //     console.log('» offer', desc.sdp);
  //     cb(undefined, desc);
  //   })
  //   .catch(function(error) {
  //     console.error('could not create offer', error);
  //     cb(error.message);
  //   });

  peerConnection.createOffer(function(desc) {
    peerConnection.setLocalDescription(desc);
    console.log('» offer', desc.sdp);
    cb(undefined, desc);
  }, function(error) {
    console.error('could not create offer', error);
    cb(error.message);
  }, offerConstraints);
}

socket.on('createOffer', function(options, cb) {
  console.log('« createOffer');

  if (gumStream) {
    console.log('has a gumStream!');
    createOffer(options, cb);
  } else {
    console.log('needs a gumStream!');
    navigator.getUserMedia(
      { video: true, audio: true },
      function(stream) {
        var videoElement = document.createElement('video');
        document.body.appendChild(videoElement);
        videoElement.src = window.URL.createObjectURL(stream);
        videoElement.play();
        peerConnection.addStream(stream);

        gumStream = stream;
        createOffer(options, cb);
      },
      function(err) {
        console.log('Could not get user media :(');
        cb(err.message);
      }
    );
  }
});

socket.on('answer', function(desc) {
  console.log('« answer', desc.sdp);
  peerConnection.setRemoteDescription(
    new RTCSessionDescription(desc)
  );
});

socket.on('offer', function(desc, cb) {
  console.log('« offer', desc.sdp);
  peerConnection.setRemoteDescription(
    new RTCSessionDescription(desc),
    function() {

      // peerConnection.createAnswer({ iceRestart: true })
      //   .then(function(desc) {
      //     peerConnection.setLocalDescription(desc);
      //     console.log('» answer', desc.sdp);
      //     cb(undefined, desc);
      //   })
      //   .catch(function(error) {
      //     cb(error.message || error);
      //     alert('Error while setting createAnswer: ' + (error.message || error));
      //   });

      peerConnection.createAnswer(
        function(desc) {
          peerConnection.setLocalDescription(desc);
          console.log('» answer', desc.sdp);
          cb(undefined, desc);
        },
        function(error) {
          cb(error.message || error);
          alert('Error while setting createAnswer: ' + (error.message || error));
        }
      );
    },
    function(err) {
      cb(err.message || err);
    }
  );
});

socket.on('restartCandidate', function(candidate) {
  peerConnection.addIceCandidate(
    new RTCIceCandidate(candidate)
  );
});

socket.on('error', function(err) {
  console.error('Error!', err);
});

socket.on('dsconnect', function() {
  console.error('Disconnected');
});

socket.on('reconnect', function() {
  console.warn('Reconnected');
  socket.emit('restart reconnected', serverSaysIAm);
});

socket.on('reconnect_failed', function() {
  console.error('Could not reconnect, sorry!');
});

socket.on('restart you are', function(iAm) {
  console.log('Server says I am', iAm);
  serverSaysIAm = iAm;
});

socket.emit('restart');
