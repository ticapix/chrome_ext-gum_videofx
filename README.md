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

## How it works ?

1. For each page, the extension installs a tiny hook on the navigator.getUserMedia browser function
2. If the webpage application calls navigator.getUserMedia, the hook is triggered and loads additional code, the video effects and their dependencies.
3. the hook calls the real native getUserMedia, gets the video stream back from the camera and applies it to a \<video\> tab.
4. THREE.js is initiated and a WebGL canvas created
5. a video effect is applied with the <video> tag as input and the previously created canvas as output
6. a stream video is captured from the canvas using HTMLCanvasElement.captureStream() and returned to the webpage application


## TODO

- [ ] use grunt instead of Makefile (seems more JS/npm friendly)
- [ ] run jshint before packing the extension https://github.com/gruntjs/grunt-contrib-jshint
- [ ] minify code before packing the extension https://github.com/gruntjs/grunt-contrib-uglify
- [ ] add some test with karma or something
- [X] add more effect
- [X] add popup page to configure effect
- [X] add popup page to enable/disable extension
