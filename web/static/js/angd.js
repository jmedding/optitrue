import {Events} from "web/static/js/events";

export var AngD = {
  init: function () {
    Events.subscribe('test', function (e) {console.log("received", e);})
  }
}