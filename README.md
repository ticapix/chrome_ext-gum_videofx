# WebRTC video effects
Apply video effect for WebRTC application

## What is it ?

This is a Chrome extension that add a lazy hook on [getUserMedia()](https://w3c.github.io/mediacapture-main/getusermedia.html) function in all web pages.
It means that if the web page calls the getUserMedia() function, the extension will
- load additional files
- add video effect on top of the video stream coming from the camera.


You can get a better idea of what it does by opening the developer console via the F12 key.

The video effects are done on WebGL with [three.js](http://threejs.org/)

## Install

[Extension](https://chrome.google.com/webstore/detail/webrtc-video-effect/oeilcibfeihdekhhlopefndagpponjpo)

## Demo

Once you installed the extension, you can try it out here

- https://appear.in/ticapix
- https://apprtc.appspot.com/r/ticapix
- https://simpl.info/getusermedia/
- any website using WebRTC

## TODO

- [ ] add more effect
- [ ] add popup page to configure effect
- [ ] add popup page to enable/disable extension
