import {Events} from "web/static/js/events";
import {Solver} from "web/static/js/solver";

export var AngD = {
  sightings: [], //{time, rev},
  params: null,

  init: function () {
    var self = this;
    Events.subscribe('test', function (e) {console.log("received", e);})
    Events.subscribe('sighting', handle_crossing(self));
  }
}

function handle_crossing(angd) {
  return function(time) {
    // time is in seconds and corresponds to video time
    var update =  {};
    angd.sightings = log_sighting(angd.sightings, time);
    console.log("sightings", angd.sightings);

    if (angd.sightings.length < 3) return;
    if (!angd.params) {
      update = determine_params(angd.sightings);
    } else {
      update = assess_laps(angd.sightings, angd.params);
    }

    // can we simply apply the update to angd (extend?)
    angd.sightings = update.sightings;
    angd.params = update.params;
  }

}

function log_sighting(sightings, time) {
  var n = sightings.length;
  var rev = n;
  if (n > 1) {
    rev = sightings[n-1].rev + 1;
  }
  var x = {"time": time, "rev": rev};
  sightings.push(x);
  return sightings;
}

// take the first three sightings and figure out
// - the number of revolutions between sightings
// - the paramters to convert time into revolutions
// - revs(t) = a*t^2 + b*t + c
function determine_params(sightings) {
  var n = sightings.length;
  var params;

  if (n < 3) console.log("weird: expected 3 sightings", n);

  var lap0 = get_lap_time(sightings, n-1);
  var lap1 = get_lap_time(sightings, n);
  console.log("lap times", n, lap0, lap1);
  console.log("sightings", sightings);
  if (lap1 > lap0) {
    if (lap1 < 2 * lap0) {
      // |.....|.......|
      // assume one revolution between for each lap
      // can use existing crossing.rev values
    } else if (lap1 < 3* lap0) {
      // |.....|.......:.........|
      //assume one rev for first sighting and 2 for second
      sightings[n-1].rev = sightings[n-2].rev + 2;
    } else {
      // |.....|.......:.........:...........|
      // too many sightings missed - delete all but last
      sightings = reject_all_but_last(sightings);
    }
  } else {
    // |.....:.......|.........|
    //the first->second sighting has more than one revolution
    if (lap0 < 2 * lap1) {
      // |.....:.......|.........|
      sightings[n-2].rev = 2;
      sightings[n-1].rev = 3;
    } else {
      // |.....:.......:.........|..........|
      // missed too many crossings - delete all but last
      sightings = reject_all_but_last(sightings);
    }
  }

  if (sightings.length < 3) {
    params = null;
  } else {
    // TODO: calc params
    Solver.solve(sightings, "time", "rev");
    params = null; //{"a": 1, "b": 2, "c": 3};
  };
  return {"sightings": sightings, "params": params};
}

function assess_laps(sightings) {

}

function get_lap_time(sightings, n) {
  return sightings[n-1].time - sightings[n-2].time;
}

function reject_all_but_last(sightings) {
  console.log("resetting:", sightings);
  var n = sightings.length;
  sightings = sightings.slice(n-1, n);
  // reset lap counter
  sightings[0].rev = 0;
  return sightings
}