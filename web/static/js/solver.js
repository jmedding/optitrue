import {Events} from "web/static/js/events";

// This module is used to fit the angular velocty and deceleratoin parameters to the measured values
export var Solver = {
  solve : function (xyPairs, xname, yname) {
    //xyPairs [{x,y}, {x,y}, {x,y}, ...]

    //take the first, middle and last pair
    var mid = Math.round((xyPairs.length-1)/2);
    var xy3Pairs = [xyPairs[0], xyPairs[mid], xyPairs[xyPairs.length -1]];

    // build jsFeat matrices
    // new jsfeat.matrix_t(columns, rows, data_type, data_buffer);
    var data_type = jsfeat.F32_t | jsfeat.C1_t; //single channel 32 bit float
    var matYs = new jsfeat.matrix_t(1, xy3Pairs.length, data_type);
    var matXs = new jsfeat.matrix_t(3, xy3Pairs.length, data_type);

    populate_y(xy3Pairs, yname, matYs.data);
    populate_x(xy3Pairs, xname, matXs.data);


    jsfeat.linalg.lu_solve(matXs,matYs);
    //lu_solve puts the calculated coefficients into matYs
    var params = matYs.data;
    
    var withCalculated = apply_params(xyPairs, xname, yname, params);
    console.log("calc", withCalculated);

    // returns a function --> revs(t) = a*t^2 + b*t + c
    return calculateY(params)
  }
}

// Listen and respond
Events.subscribe('calculate_angD_params', function (data) {
  // data -> {xyPairs: [{x,y}, {x,y}, {x,y}, ...], xname, yname}
  var result = Solver.solve(data.xyPairs, data.xname, data.yname);
  Events.publish('angD_func_updated', result);
})

// Populate matrix
function populate_y(pairs, yname, f32Data) {
  // f32Data => 3 x 1 float32Array
  f32Data.set( pairs.map(function (pair) {return pair[yname]}), 0)
}

//Populate matrix
function populate_x(pairs, xname, f32Data) {
  // f32Data => 3 x 3 float32Array

  for (var i = 0; i < pairs.length; i++) {
    var x = pairs[i][xname];
    f32Data.set( [ 1 ],    (i*3)     );
    f32Data.set( [ x ],    (i*3 + 1) );
    f32Data.set( [ x*x ],  (i*3 + 2) );
  }
}

// Apply params (Y = a + bX + cXX) to array of measured pairs for comparison
function apply_params(xyPairs, xname, yname, params) {
  var calcFunc = calculateY(params);
  return xyPairs.map(function(pair){
    var x = pair[xname];
    var yCalc = calcFunc(x);
    return [x, pair[yname], yCalc]; 
  });
}

// Return a function that calculates y given x for the given params
// Apply params (Y = a + bX + cXX) 
function calculateY(params) {
  return function(x){
    return params[0] + params[1]*x + params[2]*x*x;
  };
}

//calculate the error^2 summed for all pairs
function error(vals) {
  // vals => [x, yActual, yCalc]
  return vals.reduce(function (sum, a) {
    var e2 = (a[1]-a[2])*(a[1]-a[2]);
    return sum + e2;
  }, 0.0)
} 