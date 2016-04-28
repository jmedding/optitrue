'use strict'

// my tracking.js 
if (tracking) console.log("tracking found tracker");
if (jsfeat) console.log("tracking found jsfeat");

//debug settings
var dPlotBackgroundVs = false;
var dLogBest = 0;
var dLogVid = 1;
var dPlotWheelContourLast = 1;
var dPlotWheelContourNew = 1;
var dPlotWheelContourAdjusted = 1;
var dPlotChart = 1;
var dPlotAChart = 1; 

var results = {};
var datapoints = [];
var aChartCtx = document.getElementById('aChart').getContext('2d');
var aChart;
var angV = 7.6;
var chartCan = document.getElementById('chart');
var chartCtx = chartCan.getContext('2d'); 
var chart;
var vid = document.getElementById('v-in');
var lastTime;
var w = 450;
var h = 150;
var can = document.getElementById('c-out');
can.width = w;
can.height = h;
var ctx = can.getContext('2d');
var hcan = document.createElement('canvas');
hcan.width = w;
hcan.height = h;
var hctx = hcan.getContext('2d');
var refCorners = [];
var refdescriptors = null;
tracking.Brief.N = 128;
var imgData, blurRadius, gray, corners, descriptors, matches, reduced
var prior = [];
var current = [];
var bestMatches;
var socan = document.getElementById('s-out');
var soctx = socan.getContext('2d');
var wCorners = [];
var wDescriptors = [];
var wCorners_last = [];
var wDescriptors_last = [];
// RANSAC params
var ransac = jsfeat.motion_estimator.ransac;
var homo_kernel = new jsfeat.motion_model.homography2d();
var transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
var model_size = 25; // minimum points to estimate motion
var thresh = 3; // max error to classify as inlier
var eps = 0.5; // max outliers ratio
var prob = 0.99; // probability of success
var params = new jsfeat.ransac_params_t(model_size, thresh, eps, prob);
var max_iters = 1000;
//
var wheelOffset;
var wheelMatch;

var BriefTracker = function() {
  BriefTracker.base(this, 'constructor');
}
tracking.inherits(BriefTracker, tracking.Tracker);

BriefTracker.prototype.track = function(pixels, width, height) {
  if (vid.currentTime == lastTime){
    return
  }
  if (dLogVid) console.log("vid", vid.currentTime, 1/(vid.currentTime-lastTime));
  lastTime = vid.currentTime;

  hctx.drawImage(vid, 250, 200, w, h, 0, 0, w, h);
  imgData = hctx.getImageData(0, 0, w, h);
  blurRadius = 3;
  gray = tracking.Image.grayscale(tracking.Image.blur(imgData.data, w, h, blurRadius), w, h);

  corners = tracking.Fast.findCorners(gray, w, h);
  corners = filterCorners2(corners, w/4, h/2, w/2);
  descriptors = tracking.Brief.getDescriptors(gray, w, corners);

  if (refCorners.length == 0) {
    refCorners = corners;
    refdescriptors = descriptors;
    return
  }

  bestMatches = tracking.Brief.reciprocalMatch(refCorners, refdescriptors, corners, descriptors)
    .sort(function(a, b) {return b.confidence - a.confidence;})
    .slice(0,20);

  var a = affine(bestMatches);
  ctx.setTransform(a[0], a[3], a[1], a[4], a[2], a[5]);
  ctx.drawImage(hcan, 0, 0);

  if (dPlotBackgroundVs) plotMatches(ctx, bestMatches);

  if (wheelOffset = getWheelOffsets(ctx)){
    if (dPlotChart) chart.plot(wheelOffset.dx, wheelOffset.dy);
    //if (dPlotAChart) aChart.plot(vid.currentTime, wheelOffset.dx);
    if (dPlotAChart) aChart.plot(Math.sin(vid.currentTime*angV), wheelOffset.dx);
    wheelMatch = {"keypoint1": [250, 90], "keypoint2": [250+wheelOffset.dx, 90 + wheelOffset.dy]};
    ctx.resetTransform();
    if (dPlotWheelContourAdjusted) plotWheelMatch(ctx, wheelMatch);
    wheelOffset.time = vid.currentTime;
    this.emit('track', {
      // Your results here
      "data": [wheelOffset]
    });
  };

}

var getWheelOffsets = function (ctx) {
  var imgdata = miniSoebel(ctx, 190, 75, soctx);
  var w = imgdata.width;
  var h = imgdata.height;
  var miniGrey = getGrey(imgdata.data, w, h);
  wCorners = getTireContourPoints(miniGrey, w, h);
  if (dPlotWheelContourLast) plotPoints(soctx, wCorners_last, 'yellow');
  if (dPlotWheelContourNew) plotPoints(soctx, wCorners);
  if (wCorners_last.length == 0) {
    wCorners_last = wCorners;
    return;
  }

  return contourOffset(wCorners_last, wCorners);
}

var contourOffset = function (old, now) {
  var dy;
  var dys = [];
  var sumdy;
  var sumvar;
  var n;
  var best = {"i": -999, "var": 100000000};
  var searchRange = 20; //num pixels to scan across

  for (var i = -searchRange; i < searchRange; i++){
    n=0; sumdy = 0; sumvar = 0; dys = [];
    for (var j = 0;  j < old.length; j++){
      if(old[j] && now[j+i]){
        dys[j] = now[j+i].y - old[j].y ;
        sumdy += dys[j];
        n++;
      }
    }
    var avedy = sumdy / n;
    sumvar = dys.reduce(function (sum, dy){return sum += (dy-avedy)*(dy-avedy)}, 0);

    if (sumvar/n < best.var){
      best = {"i": i, "dy": avedy, "var": sumvar/n};
    }
  }
  if (dLogBest) console.log("best", best);
  if (dPlotWheelContourAdjusted) plotPoints(soctx, now.map(function(p){
    if (p) return  makePoint( p.x - best.i, p.y -best.dy);
    return;
  }), 'lime');
  if (best.i > 10) alert("wow - that's a big offset", best);
  return {"dx": best.i, "dy": best.dy};
}

var getTireContourPoints = function (pixels, w, h) {
  // Expect bottom of image, which is a greyscale of a soebel
  // and therefore having high contrast, to be dark until the tire
  // contour. Scan from bottom up, marking the position of the first
  // bright pixel in each column, Return an array of point objects
  // that can be used in RANSAC
  var left = Math.floor(w / 4);
  var right = 3 * left;
  var points = [];
  var point;
  for (var c= left; c < right; c++){
    points[c] = find_first_bright_point_from_bottom_of_column(pixels, w, h, c, 120)
  }

  //console.log("points", points);
  return points;
}

var find_first_bright_point_from_bottom_of_column = function(pixels, w, h, c, threshold) {
  for (var r = h; r >= 0; r--) {
    var i = r * w + c;
    if (pixels[i] > threshold) {
      return makePoint(c, r)
    }
  }
}

var makePoint = function (x, y){
  return {"x": x, "y": y};
}

var doRansac = function (prior, current) {
  prior = prior.filter(function(p){return p});
  current = current.filter(function(p){return p});
  var l = Math.min(prior.length, current.length);
  var from = prior.slice(0,l);
  var to   = current.slice(0,l);

  var mask = new jsfeat.matrix_t(to.length, 1, jsfeat.U8_t | jsfeat.C1_t);
  var ok = ransac(params, homo_kernel, from, to, from.length, transform, mask, max_iters);
  console.log("transform", transform.data);
  console.log("mask hits:", mask.data.reduce(function(sum, x){return sum += x}, 0)/mask.data.length*100, "%")
  return {"dx": transform.data[2], "dy": transform.data[5]};
}

var plotMatches = function (ctx, matches) {
  for (var i = 0; i < matches.length; i++) {
    //console.log("help", matches);
    drawVs(ctx, matches[i], 10, 5)
  }
}
var plotWheelMatch = function (ctx, match) {
    //drawV(ctx, match.keypoint1, -10, 5, 'yellow');
    drawTail(ctx, match, 'lime',2);
}
var plotCorners = function (ctx, corners) {
  for (var i = 0; i < corners.length; i = i+2) {
    drawV(ctx, corners.slice(i, i+2), 10, 5, 'cyan');
  }
}

var plotPoints = function (ctx, points, color = 'red') {
  for (var i = 0; i < points.length; i++){
    if (points[i]){
      drawV(ctx, [points[i].x, points[i].y], 2, 1, color);
    }
  }
}

var miniSoebel = function (sourceCtx, x, y, destCtx) {
  // proivde a soebel image for a small section (the tire contour)
  // dimensions are set by the destination context.
  var w = destCtx.canvas.width;
  var h = destCtx.canvas.height;
  var imgdata = sourceCtx.getImageData(x, y, w, h);
  var pixels = tracking.Image.sobel(imgdata.data, imgdata.width, imgdata.height);
  imgdata = new ImageData(Uint8ClampedArray.from(pixels), w, h);
  soctx.putImageData(imgdata, 0, 0)
  return imgdata;
}

var getGrey = function (pixels, w, h, blurRadius = 3) {
  return tracking.Image.grayscale(tracking.Image.blur(pixels, w, h, blurRadius), w, h);
}
var affine = function (matches) {
  var count = matches.length;
  for (var i = 0; i < count; i ++) {
    prior[i] = {x: matches[i].keypoint1[0], y: matches[i].keypoint1[1]};
    current[i] = {x: matches[i].keypoint2[0], y: matches[i].keypoint2[1]};
  }
  var affine_kernel = new jsfeat.motion_model.affine2d();
  var affine_transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
  affine_kernel.run(current, prior, affine_transform, count);
  return affine_transform.data.slice(0,6);
}

var filterCorners2 = function (corners, x, y, width) {
  // Assumes the moving points of the tire should be excluded
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

var drawV = function (ctx, point, up, out, color) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(point[0] - out, point[1] + up);
  ctx.lineTo(point[0],       point[1]);
  ctx.lineTo(point[0] + out, point[1] + up);
  ctx.stroke();
}

var myTracker = new BriefTracker();


myTracker.on('track', function(event) {
  // Results are inside the event
  //console.log("track events", event);
  
  if (event.data.length === 0) {
    // No colors were detected in this frame.
  } else {
    event.data.forEach(function(datapoint) {
      datapoints.push(datapoint);
      if (datapoints.length > 100) findBestAngV(datapoints);
    });
  }

});

//tracking.track('#v-in', myTracker);
tracking.track('#v-in', myTracker);

var Chart = function (ctx, scaleX=1, scaleY=1) {
  this.ctx = ctx;
  this.scaleX = scaleX;
  this.scaleY = scaleY;
  this.width = ctx.canvas.width;
  this.height = ctx.canvas.height;
  this.last = null;
  this.init();
}

Chart.prototype.init = function (){
  console.log("chart", this);
  this.ctx.fillStyle = 'wheat';
  this.ctx.fillRect(0,0, this.width, this.height);
  this.ctx.strokeStyle = 'grey';
  this.ctx.moveTo(this.width/2, 0);
  this.ctx.lineTo(this.width/2, this.height);
  this.ctx.moveTo(0, this.height/2);
  this.ctx.lineTo(this.width, this.height/2);
  this.ctx.stroke();
};

Chart.prototype.plot = function (x,y) {
  if (this.last) {
    this.ctx.strokeStyle = 'darkgrey';
    this.ctx.moveTo(this.width/2 + this.scaleX*this.last.x, this.height/2 - this.scaleY*this.last.y);
    this.ctx.lineTo(this.width/2 + this.scaleX*x, this.height/2 - this.scaleY*y);
    this.ctx.stroke();
  }
  this.ctx.fillStyle = 'black';
  this.ctx.fillRect(this.width/2 + this.scaleX*x, this.height/2 - this.scaleY*y,1,1);
  this.last = {"x": x, "y": y};
}

if (dPlotChart) chart = new Chart(chartCtx, 5, 5);
if (dPlotAChart) aChart = new Chart(aChartCtx, 18, 2);

var addResult = function (datapoint, angV) {
  var k = key(datapoint, angV);
  typeof(results[k]) == "undefined" ? results[k] =  [datapoint] : results[k].push(datapoint);
};
var key = function (datapoint, angV) {
  // bunches the datapoints into 0.1 radian intervals
  return (Math.round(datapoint.time * 10 * angV)/10).toString();
};
var findBestAngV = function (datapoints) {
  // angV is higher for faster spinning wheel.
  // The wheel spin will slow down over time
  // In theory, the deceleration will reduce with speed
  var vBest = {"result" : 100000000};
  var result;
  for (var v = 7; v < 7.1; v+=0.2) {
    result = getVarForAngV(datapoints, v);
    console.log("angV = ", v, result);
    if (result < vBest.result) vBest = {"v": v, "result": result};
  }

  console.log("best angV = ", vBest);
}

var getVarForAngV = function (datapoints, angV) {
  //returns the average of the average varionce for each part of the wheel
  results = [];
  for (var i = 0; i < datapoints.length; i++){
    //use only the very early points as we don't know how angV decays yet
    if (datapoints[i].time > 2) continue;
    addResult(datapoints[i], angV);
  }
  var rdata = [];
  var sumVar = 0;

  for (var rad in results) {
    // rad should be a key, corresponding to video time and have an array of datapoints
    if (!results.hasOwnProperty(rad)) continue;
    var aveX = 0; //average of datapoints
    var aveY = 0; //average of datapoints
    var aveVar2 = 0; //variance of datapoints
    var points = results[rad];
    var n = points.length;  //number of datatpoints

    for (var i = 0; i < n; i++) {
      aveX += points[i].dx/n; 
      aveY += points[i].dy/n; 
    }

    for (var i = 0; i < n; i++) {
      aveVar2 += Math.pow(points[i].dx - aveX, 2) + Math.pow(points[i].dy - aveY, 2)/n; 
    }
      console.log(points, {"pos": rad, "aveX": aveX, "aveY": aveY, "aveVar2": aveVar2} );
    rdata.push({"pos": rad, "aveX": aveX, "aveY": aveY, "aveVar2": aveVar2})
    sumVar += aveVar2;
  }
  return sumVar/rdata.length;
};