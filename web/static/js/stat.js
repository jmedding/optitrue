export var StreamStat = {
  sumX: 0,
  sumsq: 0,
  n: 0,
  minPoints: 5,
  last5: [],
  sumLast5: 0,
  varianceFactor: 100,  //take the sqrt to relate it to stdev

  outlier: function (val) {
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
    
  },

  variance: function () {
    return this.sumsq/this.n - (this.sumX/this.n)*(this.sumX/this.n);
      
  },

  keepVal: function (val) {
    this.sumX += val;
    this.sumsq += val*val;
    this.n++;
    this.last5.push(val);
    this.sumLast5 += val;
    if (this.last5.length > 5) this.sumLast5 -= this.last5.shift();
  },

  check: function(val) {
    var aveLast5 = this.sumLast5 / this.last5.length
    var threshold = this.variance() * this.varianceFactor;
    //console.log("check", aveLast5, this.variance(), threshold, val);
    if ((val - aveLast5)*(val - aveLast5) > threshold) {
      return true;
    } else {
      return false;
    }
  },

  hello: function () {
    console.log("Hellow from stat");
  }

}