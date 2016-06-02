import {StreamStat} from "web/static/js/stat2";
import {Chart} from "web/static/js/chart";

export var AngV = {
  interval: null,
  lastFrameTime: 0,
  vid: null,  
  aoi: null,  //canvas used to paint the area of interest - where to scan for the tape
  frameRate: 1.0/30,
  aoiRect: {"x": 600, "y": 490, "w": 90, "h": 10},  //to be updated
  aoiPosition: {top: 0.5, left: 0.47, right: 0.53, height: 0.02},
  tireRect: {"x": 0, "y": 0, "w": 0, "h": 0},  //to be updated
  startTime: null,

  // top, left, right describe the region in percentage where the wheel is expected to be
  // corresponding to the guideline drawn on the video
  init: function(vid, top, left, right, debug, showCharts){
    var self = this;
    var aoiCtx;

    self. debug = !!debug;
    self.showCharts = !!showCharts;
    self.stat = new StreamStat();

    if (debug){
      if (tracking) console.log("AngV found tracker");
      if (jsfeat) console.log("AngV found jsfeat");
    }

    self.vid = vid;
    if (self.vid.videoHeight == 0) {
      //vidoe metadata not yet loaded
      self.vid.addEventListener('loadedmetadata', function(e){
        //console.log("metadata loaded", e);
        self.init(vid, top, left, right, debug, showCharts);
      });
      return      
    };

    self.tireRect = rectangleFromVideoElement(vid, left, right, top);
    self.aoi = findOrSetAoiCanvas(self);
    self.aoiRect.x = self.tireRect.x + self.tireRect.w * self.aoiPosition.left;
    self.aoiRect.y = self.tireRect.y + self.tireRect.h * self.aoiPosition.top;
    self.aoiRect.w = self.aoi.width;
    self.aoiRect.h = self.aoi.height;

    //console.log("showCharts", vid, top, left, right, debug, showCharts);

    if (showCharts) self.chart = new Chart(
      document.getElementById('chart')
      .getContext('2d'), 30, 0.4, {"xOrigin": 'left', "yOrigin":'bottom', "line":false});
    //return self.interval = window.setInterval(self.run, self.frameRate * 1000, self, aoiCtx);
  },

  start: function () {
      self = this;
      return function () {
        console.log("starting");
        self.stat = new StreamStat();
        self.startTime = self.vid.currentTime;
        if (self.showCharts) self.chart.reset();
        self.interval = window.setInterval(self.run, self.frameRate * 1000, self, self.aoi.getContext('2d'));
        
      }
  },

  stop: function () {
      window.clearInterval(this.interval);
      this.interval = null;
  },

  run: function (self, ctx) {
    if (self.lastFrameTime == self.vid.currentTime) return;
    if (self.debug) console.log("run", self.vid.currentTime);
    var val;
    
    var rect = self.aoiRect;
    ctx = self.aoi.getContext('2d');
    ctx.drawImage(self.vid, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    self.lastFrameTime = self.vid.currentTime;
    val = getBrightness(ctx);

    var outlier = self.stat.outlier(val);
    if (self.showCharts){
      var time = self.lastFrameTime - self.startTime;
      self.chart.plot(time, val, outlier)
    } 
  },

}

function  getBrightness (ctx) {
    var canvas = ctx.canvas;
    var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    var data = imageData.data;
    var r,g,b,avg;
    var colorSum = 0;

    for(var x = 0, len = data.length; x < len; x+=4) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];

        //optimized for yellow
        avg = Math.floor((r+g-b)/3);
        colorSum += avg;
    }
    //not sure we really need to divide by the area, it is always the same
    return colorSum / (canvas.height*canvas.width);
  }

function rectangleFromVideoElement (vid, left, right, top) {
  var rect = {};
  rect.x = vid.videoWidth * left;
  rect.y = vid.videoHeight * top;
  rect.w = vid.videoWidth * (right - left);
  rect.h = vid.videoHeight - rect.y;
  return rect;
}

function findOrSetAoiCanvas (self) {
  var aoiCanvas = self.debug ? 
    document.getElementById('aoi') : document.createElement('canvas');
  aoiCanvas.width = self.tireRect.w * (self.aoiPosition.right - self.aoiPosition.left);
  aoiCanvas.height = self.tireRect.h * self.aoiPosition.height;
  return aoiCanvas;
}


