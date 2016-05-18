window.onload = function() {
    //Compatibility
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    var canvas = document.getElementById("canvas"),
        context = canvas.getContext("2d"),
        video = document.getElementById("video"),
        btnStart = document.getElementById("btnStart"),
        btnStop = document.getElementById("btnStop"),
        btnPhoto = document.getElementById("btnPhoto"),
        videoObj = {
            video: true,
            audio: true
        };
    var localMediaStream = null;
    btnStart.addEventListener("click", function() {
        if (navigator.getUserMedia) {
            navigator.getUserMedia(videoObj, function(stream) {
                video.src = (navigator.webkitGetUserMedia) ? window.URL.createObjectURL(stream) : stream;
                localMediaStream = stream;
            }, function(error) {
                console.error("Video capture error: ", error.code);
            });
        }
    });
    btnStop.addEventListener("click", function() {
        console.log('localMediaStream', localMediaStream)
        for (var track of localMediaStream.getTracks()) {
            track.stop()
        }
    });
    btnPhoto.addEventListener("click", function() {
        context.drawImage(video, 0, 0, 320, 240);
    });
    btnStart.click();
};