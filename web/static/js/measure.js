import {Stabilizer} from "web/static/js/stabilizer";
import {Events} from "web/static/js/events";
import {Guage} from "web/static/js/guage";

export var Measure = function (vidElement, guide, debug=true) {
  this.debug = debug;
  this.stabilizer = new Stabilizer(vidElement, guide);
  if (debug) {
    document.getElementById('debug')
    .appendChild(this.stabilizer.aoiCan);
  }

  Events.subscribe('newFrame', this.run());
}

//will be called on 'newFrame' events, coming from Cam.js
Measure.prototype.run = function() {
  var self = this;
  return function (data) {
    self.stabilizer.processVideo(data);
  }
};