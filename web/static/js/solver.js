
export var Solver = {
  solve : function (xyPairs, xname, yname) {
    //xyPairs [{x,y}, {x,y}, {x,y}, ...]

    // build jsFeat matrices
    // new jsfeat.matrix_t(columns, rows, data_type, data_buffer);
    var data_type = jsfeat.F32_t | jsfeat.C1_t; //single channel 32 bit float
    var matYs = new jsfeat.matrix_t(1, xyPairs.length, data_type);
    var matXs = new jsfeat.matrix_t(3, xyPairs.length, data_type);

    populate_y(xyPairs, yname, matYs.data);
    populate_x(xyPairs, xname, matXs.data);

    console.log("matYs", matYs.data);
    console.log("matXs", matXs.data);


  }
}

// Populate matrix
function populate_y(pairs, yname, f32Data) {
  // f32Data => 3 x n float32Array
  f32Data.set( pairs.map(function (pair) {return pair[yname]}), 0)
}

//Populate matrix
function populate_x(pairs, xname, f32Data) {
  // f32Data => 3 x n float32Array

  for (var i = 0; i < pairs.length; i++) {
    var x = pairs[i][xname];
    f32Data.set( [ 1 ],    (i*3)     );
    f32Data.set( [ x ],    (i*3 + 1) );
    f32Data.set( [ x*x ],  (i*3 + 2) );
  }
}