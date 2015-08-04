# ice-restart-test
Test peer connections surviving network changes

To start:

```
$ npm start
```

By default it's on port 9094 (set the `PORT` environment variable to use a different port), and
you should run it somewhere that is reachable after changing networks (you'll want to end up on a
different public IP address). [ngrok][ngrok] was used during testing.

[ngrok]: https://ngrok.com/

How to try it
-------------

1. Start the app.
2. Open the URL shown in the terminal on two computers. Only Chrome is known to work
   at the time this test was written.
3. Allow access to the camera when prompted, and the video should appear on the other computer.
4. Change the network that one of the computers is on (so that it will come from a different public
   IP)
5. Wait for the socket.io connection to timeout, and reconnect. Once completed the computers will
   exchange ice candidates again and the video shoudl resume.

Notes
-----

The server treats the first browser to connect as the "offerer" (it will acquire a stream from an
attached camera), and the second as the "answerer" (it will get the stream through the peer
connection).

The server only supports a single pair (it's just a test!). To use two new computers, or if you
manually refresh the pages you'll need to restart the server.
