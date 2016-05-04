
export var Cam = {


  init: function() {
    this.video = document.getElementById('#videoElement');
    navigator.getUserMedia = navigator.getUserMedia 
    || navigator.webkitGetUserMedia 
    || navigator.mozGetUserMedia 
    || navigator.msGetUserMedia 
    || navigator.oGetUserMedia;

    if (navigator.getUserMedia) {       
        navigator.getUserMedia({video: true}, handleVideo, videoError);
    }

  },
  
  handleVideo:  function (stream) {
    video.src = window.URL.createObjectURL(stream);
  },

  videoError: function (e) {
    console.log("Not able to access Camera");
  }
  

}

 
 
 
 