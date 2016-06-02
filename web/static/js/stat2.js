export var StreamStat = function () {
  this.sumX = 0;
  this.sumsq = 0;
  this.n = 0;
  this.minPoints = 5;
  this.last5 = [];
  this.sumLast5 = 0;
  this.varianceFactor = 25;
}

StreamStat.prototype.outlier = function (val) {
  if (this.last5.length >= this.minPoints && this.check(val)) {
    //it's an outlier, don't add this val to the stats
    this.last5 = [];
    this.sumLast5 = 0;
    return true;
  } else {
    //it's normal, or we don't have enough points yet - use the data
    this.keepVal(val);
    return false;
  };
}

StreamStat.prototype.variance = function () {
  return this.sumsq/this.n - (this.sumX/this.n)*(this.sumX/this.n);
}

StreamStat.prototype.keepVal = function (val) {
  this.sumX += val;
  this.sumsq += val*val;
  this.n++;
  this.last5.push(val);
  this.sumLast5 += val;
  if (this.last5.length > 5) this.sumLast5 -= this.last5.shift();
}

StreamStat.prototype.check = function(val) {
  var aveLast5 = this.sumLast5 / this.last5.length
  var threshold = this.variance() * this.varianceFactor;
  //console.log("check", aveLast5, this.variance(), threshold, val);
  //only car about positive outliers, so no need to sqare the difference
  if ((val - aveLast5)*Math.abs((val - aveLast5)) > threshold) {
    return true;
  } else {
    return false;
  }
}


