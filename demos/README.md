## Demos

To run the demos, download rear-window.js

    git clone git://github.com/lukes/rear-window.js.git

Open the files in the `rear-window.js/demos` directory in a browser

### simple.html

Simple example with no configuration.
  
    // load Rear Window
    Rear();

### initial-object.html

Start Rear-Window.js on a particular variable.

    // make a complicated variable
    var _big_obj = { 'n': 100, 'nan': NaN, 'x': [1, 2, 3, 4], 'y': function() { alert(true) }, 'b': 0, 's': "hello", z: { i: 51, o: "goodmorning sir, \nhow goes it?", regex: new RegExp("hello!", "gim")} };
    
    // load Rear Window
    Rear('_big_obj');