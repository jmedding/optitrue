import {StreamStat} from "web/static/js/stat";

export var AngV = {

  colorTracker: new tracking.ColorTracker(['yellow']),
  lastFrameTime: 0,
  vid: null,  
  aoi: null,  //area of interest
  aoiCoords: {"x": 600, "y": 490, "w": 90, "h": 20},
  frameRate: 1.0/30,

  init: function(){
    var self = this;
    var rect = this.aoiCoords;
    if (tracking) console.log("AngV found tracker");
    if (jsfeat) console.log("AngV found jsfeat");
    this.vid = document.getElementById('source');
    if (this.vid.videoHeight == 0) {
      //vidoe metadata not yet loaded
      this.vid.addEventListener('loadedmetadata', function(e){
        //console.log("metadata loaded", e);
        self.init();
      });
      return      
    };

    this.aoi = document.getElementById('aoi');
    this.aoi.width = rect.w;
    this.aoi.height = rect.h;
    if (true) this.chart = new Chart(
      document.getElementById('chart')
      .getContext('2d'), 30, 0.4, {"xOrigin": 'left', "yOrigin":'bottom', "line":false});
    console.log("Hello!", this.vid, this.vid.videoHeight, rect.y, this.aoi); 

    this.colorTracker.on('track', function(e){
      if (this.lastFrameTime != self.vid.currentTime){
        console.log("tracking", e);
        
      } 
    });
    window.setInterval(this.run, this.frameRate * 1000, this);
    tracking.track('#aoi', this.colorTracker);
  },

  run: function (self) {
    if (self.lastFrameTime == self.vid.currentTime) return;
    var ctx, val;
    var rect = self.aoiCoords;
    ctx = self.aoi.getContext('2d');
    ctx.drawImage(self.vid, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    self.lastFrameTime = self.vid.currentTime;
    val = self.getBrightness(ctx);
    //console.log("getBrightness", val);
    var outlier = StreamStat.outlier(val);
    self.chart.plot(self.lastFrameTime, val, outlier)
  },

  getBrightness: function (ctx) {
    var canvas = ctx.canvas;
    var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    var data = imageData.data;
    var r,g,b,avg;
    var colorSum = 0;

    for(var x = 0, len = data.length; x < len; x+=4) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];

        avg = Math.floor((r+g)/3);
        colorSum += avg;
    }
    return colorSum / (canvas.height*canvas.width);
  }
}

var Chart = function (ctx, scaleX=1, scaleY=1, options={}) {
  this.ctx = ctx;
  this.scaleX = scaleX;
  this.scaleY = scaleY;
  this.width = ctx.canvas.width;
  this.height = ctx.canvas.height;
  this.last = null;
  this.xOffset = this.width/2;
  this.yOffset = this.height/2;
  this.options = options;
  this.points = 0;
  this.init();
}

Chart.prototype.init = function (){
  console.log("chart", this);
  if (this.options.xOrigin == 'left') this.xOffset = 0;
  if (this.options.yOrigin == 'bottom') this.yOffset = this.height;
  this.ctx.fillStyle = 'wheat';
  this.ctx.fillRect(0,0, this.width, this.height);
  this.ctx.strokeStyle = 'grey';
  this.ctx.moveTo(this.xOffset, 0);
  this.ctx.lineTo(this.xOffset, this.height);
  this.ctx.moveTo(0, this.yOffset);
  this.ctx.lineTo(this.width, this.yOffset);
  this.ctx.stroke();
};

Chart.prototype.plot = function (x,y, special) {
  if (this.options.line && this.last) {
    this.ctx.strokeStyle = 'darkgrey';
    this.ctx.moveTo(this.xOffset + this.scaleX*this.last.x, this.yOffset - this.scaleY*this.last.y);
    this.ctx.lineTo(this.xOffset + this.scaleX*x, this.yOffset - this.scaleY*y);
    this.ctx.stroke();
  }

  this.ctx.fillStyle = 'black';
  this.ctx.fillRect(this.xOffset + this.scaleX*x, this.yOffset - this.scaleY*y,1,1);
  this.last = {"x": x, "y": y};
  if (special) {
    console.log("Outlier", x, y);
    this.ctx.fillStyle = 'blue';
    this.ctx.fillRect(this.xOffset - 1 + this.scaleX*x, this.yOffset -1 - this.scaleY*y,3,3);
  }
  //this.points++;
  //console.log("points", this.points, x, y);
}

