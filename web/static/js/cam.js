import {AngV} from "web/static/js/angv";
import {Events} from "web/static/js/events";


export var Cam = {


  init: function() {
    var self = this;
    self.svg = document.getElementById("svgContainer");
    self.guide = {top:0.5, left: 0.2, right: 0.8};
    self.get_back_cam().then(function (back_cam) {
      self.video = document.getElementById('videoElement');
      navigator.getUserMedia = navigator.getUserMedia 
      || navigator.mediaDevices.getUserMedia
      || navigator.webkitGetUserMedia 
      || navigator.mozGetUserMedia 
      || navigator.msGetUserMedia 
      || navigator.oGetUserMedia;

      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

      console.log("navigator", navigator.getUserMedia);
      //var con = {video: {deviceId: {exact: back_cam ? back_cam.deviceId : undefined}}};

      self.paint_guide(self, self.svg);
      addClickEvents(self);
      if (navigator.getUserMedia) {       
          navigator.getUserMedia(self.constraints(back_cam), self.handleVideo(), self.videoError);
      }else{
        alert("this browser doesn't support cameras")
      }      
    })

  },
  
  handleVideo: function() {
    var self = this;
    return function (stream) {
      self.video.src = window.URL.createObjectURL(stream) || stream;
      self.video.play();
      self.video.addEventListener('loadedmetadata', function(e){
        //console.log("metadata loaded", e);
        //alert("" + self.video.videoHeight + " x " + self.video.videoWidth);
        AngV.init(self.video, self.guide, false, true)        
      });
    };
  },

  videoError: function (e) {
    alert("Video Error: Not able to access Camera");
  },

  constraints: function(camera) {
    return {
      video: {
        deviceId: camera ? camera.deviceId : undefined,
        facingMode: "environment",
        optional: [
          {minWidth: 640},
          {minWidth: 1024},
          {minWidth: 1280},
          {minWidth: 1920},
          {minWidth: 2560},
          {frameRate: 30}
        ]
      }
    }
  },

  get_back_cam: function() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      alert("enumerateDevices() not supported.");
      return;
    }

    // List cameras and microphones. return promise

    return navigator.mediaDevices.enumerateDevices()
      .then(function(devices) {
        var desired_cam;
        devices.forEach(function(device) {
          if (device.label.includes("back") || device.label.includes("rear")){
            alert(device.kind + ": " + device.label +
              " id = " + device.deviceId);
            desired_cam = device;
          }
          //alert(device.kind + ": " + device.label + " id = " + device.deviceId);
        });
        return desired_cam;
      });

      //.catch(function(err) {
      //  console.log(err.name + ": " + error.message);
      //});    
  },

  paint_guide: function (self, svg, color) {
    if (!color) color = "orange";
    var xmlns =  "http://www.w3.org/2000/svg";
    var left = svg.parentElement.clientWidth * self.guide.left;
    var right = svg.parentElement.clientWidth * self.guide.right;
    var bottom = svg.parentElement.clientHeight;
    var top = svg.parentElement.clientHeight * self.guide.top;
    var line = document.createElementNS(xmlns, "polyline");
    var points = "";
    points += left + " " + bottom + " ";
    points += left + " " + top + " ";
    points += right + " " + top + " ";
    points += right + " " + bottom + " ";
    line.setAttribute("points", points);
    line.setAttribute("stroke", color);
    line.setAttribute("fill", "transparent");
    line.setAttribute("stroke-width", 5);
    svg.appendChild(line);
  }
  

}

function addClickEvents(self) {
  self.svg.addEventListener('click', function(e) {
    !!AngV.interval ? stopRecording(self) : startRecording(self);
  });
}

function startRecording (self) {
    //alert("recording");
    var delay = 1000;
    self.paint_guide(self, self.svg, "yellow")
    //window.setTimeout(AngV.start(), delay);
    window.setTimeout(Events.publish, delay, 'start', {});
    window.setTimeout(self.paint_guide, delay, self, self.svg, "green");
}

function stopRecording (self) {
  self.paint_guide(self, self.svg, "orange");
  Events.publish('stop', {});
  //AngV.stop();
  //alert("stop");
}
 
 
 