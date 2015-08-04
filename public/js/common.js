'use strict';

if (!window.RTCPeerConnection) {
  window.RTCPeerConnection = window.mozRTCPeerConnection ||
                             window.webkitRTCPeerConnection;
}

if (!window.RTCSessionDescription && window.mozRTCSessionDescription) {
  window.RTCSessionDescription = window.mozRTCSessionDescription;
}

if (!window.RTCIceCandidate && window.mozRTCIceCandidate) {
  window.RTCIceCandidate = window.mozRTCIceCandidate;
}

if (!navigator.getUserMedia) {
  navigator.getUserMedia = (navigator.mozGetUserMedia && navigator.mozGetUserMedia.bind(navigator)) ||
                           (navigator.webkitGetUserMedia && navigator.webkitGetUserMedia.bind(navigator));
}
