import {Events} from "web/static/js/events";

export var Stabilizer = function (vidElement, guideDimensions) {
  Events.subscribe('start', this.reset);
  this.vid = vidElement;
  this.w = this.vid.videoWidth == 0 ? this.vid.clientWidth : this.vid.videoWidth;
  this.h = this.vid.videoHeight == 0 ? this.vid.clientHeight : this.vid.videoHeight;
  //console.log("w", this.w, this.h);

  //hidden canvas for background image processing
  this.hcan = document.createElement('canvas'); 
  this.hcan.width = this.w;
  this.hcan.height = this.h;
  this.hctx = this.hcan.getContext('2d');
  this.refCorners = [];
  this.refDescriptors = null;
  tracking.Brief.N = 128;
  this.zone = guideDimensions;  // Expect tire in this region
  this.aoi = {
    "x": Math.round(this.w*this.zone.left),
    "y": Math.round(this.h*this.zone.top),
    "w": Math.round(this.w*(this.zone.left - this.zone.right)),
    "h": Math.round(this.h*this.zone.top / 2)
  }

  //hidden canvas to hold stabilized image
  this.aoiCan = document.createElement('canvas'); 
  this.aoiCan.width = this.aoi.w;
  this.aoiCan.height = this.aoi.h;
  this.aoiCtx = this.aoiCan.getContext('2d');

  // Temp canvas for debuging
  this.debugCan = document.getElementById('aoi');
  this.debugCtx = this.debugCan.getContext('2d');

}

Stabilizer.prototype.reset = function() {
  self = this;
  return function () {
    self.refCorners = [];
    self.refDescriptors = null;
  }
};

// Feed the process functoin with the video element (normally useage)
Stabilizer.prototype.processVideo = function(data) {
  var w = this.w;
  var h = this.h;
  var imgData; 
  this.hctx.drawImage(this.vid, 0, 0, w, h, 0, 0, w, h);
  imgData = hctx.getImageData(0, 0, w, h);
  var a = this.process(imgData);
  this.debugCtx.setTransform(a[0], a[3], a[1], a[4], a[2], a[5]);
  this.debugCtx.drawImage(hcan, 0, 0);//, w,h,0,0, this.debugCan.width, this.debugCan.height);
  //this.aoiCtx.setTransform(a[0], a[3], a[1], a[4], a[2], a[5]);
  //this.aoiCtx.drawImage(hcan, aoi.x, aoi.y, aoi.w, aoi.h, 0, 0, aoi.w, aoi.h);

  if (1 ) plotMatches(this.debugCtx, bestMatches);
};

Stabilizer.prototype.processImage = function(first_argument) {
  // body...
};

// returns a stabilized image in the area of interest (aoi), 
Stabilizer.prototype.process = function(imgData) {

  console.log("Stabilize-Process!");
  console.log("imgData", imgData.data.slice(0,10));
  var w = imgData.width;
  var h = imgData.height;
  var blurRadius = 3;
  var gray // grayscale pixels of full vid
  var corners;
  var descriptors;
  var bestMatches;
  //var ctx = this.ctx;
  var hcan = this.hcan;
  var aoi = this.aoi;


  gray = tracking.Image.grayscale(
    tracking.Image.blur(imgData.data, w, h, blurRadius),
    w, h);

  corners = getCorners(gray, w, h, this.zone);
  descriptors = tracking.Brief.getDescriptors(gray, w, corners);

  if (this.refCorners.length == 0) {
    this.refCorners = corners;
    this.refdescriptors = descriptors;
    return
  }

  bestMatches = tracking.Brief.reciprocalMatch(
    this.refCorners, 
    this.refdescriptors, 
    corners, 
    descriptors)
    .sort(function(a, b) {return b.confidence - a.confidence;})
    .slice(0,30);

  var transform = affine(bestMatches);
  //console.log("transform", transform);
  

  return transform;
};

var getCorners = function (grayPixels, w, h, zone) {
  // May eventually speed this up by first 
  // extracting the corners from the corners of the 
  // image only and then combining them into one array
  var corners = tracking.Fast.findCorners(grayPixels, w, h);
  var x = w * zone.left;
  var y = h * zone.top;
  var zoneWidth = w * (zone.right - zone.left);
  corners = filterCorners(corners, x, y, w);
  return corners;
}

var filterCorners = function (corners, x, y, width) {
  // The moving points of the tire should be excluded
  // will filter all points in the box starting at x,y with
  // width = width and down to bottom of image
  var result = [], cx, cy;
  for (var i = 0; i < corners.length; i = i+2) {
    cx = corners[i];
    cy = corners[i+1];
    if (cy < y || cx < x || cx > x + width) {
      result.push(cx, cy);
    }
  }
    return result;
}

export var affine = function (matches) {
  var affine_transform = affine2d(matches);
  return affine_transform.data.slice(0,6);
}

export var affine2d = function (matches) {
  var prior = [];
  var current = [];
  var count = matches.length;
  for (var i = 0; i < count; i ++) {
    prior[i] = {x: matches[i].keypoint1[0], y: matches[i].keypoint1[1]};
    current[i] = {x: matches[i].keypoint2[0], y: matches[i].keypoint2[1]};
  }
  var affine_kernel = new jsfeat.motion_model.affine2d();
  var affine_transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
  affine_kernel.run(current, prior, affine_transform, count);
  return affine_transform;
}

export function plotMatches (ctx, matches) {
  for (var i = 0; i < matches.length; i++) {
    //console.log("help", matches);
    drawVs(ctx, matches[i], 10, 5)
  }
}

var drawVs = function (ctx, match, up, out) {
  if (match.confidence == 1) { return}
  //console.log("match", match);
  //drawV(ctx, match.keypoint2, up, out, 'yellow');
  drawV(ctx, match.keypoint1, up, out, 'cyan');
  drawTail(ctx, match, 'red')
}

var drawTail = function (ctx, match, color = 'red', stroke_width = 1) {
  var oldStrokeWidth = ctx.lineWidth;
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke_width;
  ctx.beginPath();
  ctx.moveTo(match.keypoint1[0], match.keypoint1[1]);
  ctx.lineTo(match.keypoint2[0], match.keypoint2[1]);
  ctx.stroke();
  ctx.strokeStyle = oldStrokeWidth;

}

export var drawV = function (ctx, point, up, out, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(point[0] - out, point[1] + up);
  ctx.lineTo(point[0],       point[1]);
  ctx.lineTo(point[0] + out, point[1] + up);
  ctx.stroke();
}