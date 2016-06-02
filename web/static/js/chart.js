export var Chart = function (ctx, scaleX=1, scaleY=1, options={}) {
  this.ctx = ctx;
  this.scaleX = scaleX;
  this.scaleY = scaleY;
  this.width = ctx.canvas.width;
  this.height = ctx.canvas.height;
  this.xOffset = this.width/2;
  this.yOffset = this.height/2;
  this.options = options;
  this.init();
}

Chart.prototype.init = function (){
  this.last = null;
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
  // console.log("plot:", x, y);
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
}

Chart.prototype.reset = function () {
  this.ctx.clearRect(0, 0, this.width, this.height);
  this.init();
}
