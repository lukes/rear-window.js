// TODO should I unbind every action before removing things from DOM?
// TODO can rearwindow remember the last selected path, so on reload it selects what it was last looking at?

Rear = function(initial_object, options) {

  // event management (thanks John Resig)
  // via blackbird.js http://www.gscottolson.com/blackbirdjs/ (thanks G. Scott Olson)
  var addEvent = function ( obj, type, fn ) {
    var obj = ( obj.constructor === String ) ? document.getElementById( obj ) : obj;
    if ( obj.attachEvent ) {
      obj[ 'e' + type + fn ] = fn;
      obj[ type + fn ] = function(){ obj[ 'e' + type + fn ]( window.event ) };
      obj.attachEvent( 'on' + type, obj[ type + fn ] );
    } else obj.addEventListener( type, fn, false );
  }
  var removeEvent = function ( obj, type, fn ) {
    var obj = ( obj.constructor === String ) ? document.getElementById( obj ) : obj;
    if ( obj.detachEvent ) {
      obj.detachEvent( 'on' + type, obj[ type + fn ] );
      obj[ type + fn ] = null;
    } else obj.removeEventListener( type, fn, false );
  }

  // called when a new column is added to DOM
  var addColumn = function(v) {
    if (typeof(v) == "string") v = eval(v);
    var e = document.createElement("div");
    addClass(e, 'col');

    // delegate the drawing of the contents of the div
    // depending on if this column is for an object 
    // (whose properties should be listed in the column)
    // or a variable (whose value should be displayed)

    var type = realTypeOf(v);
    if (type == 'object' || type == 'html element' || type == 'audio' || type == 'image') { // if this is an object that has properties
      contents = columnForObject(v);
    } else {
      contents = columnForVar(v, type);
    }

    e.appendChild(contents);
    return e;
  }

  // print the inspection column for a variable
  var columnForVar = function(obj, type) {
    var div = document.createElement("div");
    addClass(div, 'var');
    var value = inspectVar(obj);
    value = value.replace(/</gim, '&lt;').replace(/</gim, '&gt;'); // encode angle brackets
    div.innerHTML = ['<div id="type">', type, '</div><div id="val">', value, '</div>'].join('');
    return div;
  }
  
  // called from columnForVar()
  // convert variable value(s) to strings
  var inspectVar = function(v) {
    var type = realTypeOf(v);
    switch(type) {
      case 'array':
        var s = []; // elements of this array will be pushed into s
        for (var i=0;i<v.length;i++) {
          s.push(inspectVar(v[i])); // call this method again
        }
        s = s.join(',');
        return ['[', s, ']'].join('');
      case 'string':
        return ['"', s, '"'].join('');
      case 'undefined':
        return 'undefined';
      case 'null':
        return 'null';
      case 'storage':
        return JSON.stringify(v);
      case 'object':
        return JSON.stringify(v);
      case 'html element':
        return v.innerHTML;
      case 'image': // TODO have a rethink about this
        return JSON.stringify({width: v.width, height: v.height, title: v.title, alt: v.alt, src: v.src});
      case 'audio': // TODO have a rethink about this
        return JSON.stringify({autoplay: v.autoplay, controls: v.controls, loop: v.loop, preload: v.preload, src: v.src}); 
      default:
        return v.toString();
    }
  }
  
  // display the properties of the object
  // with categories at the top
  var columnForObject = function(obj) {
    var ul = document.createElement("ul");

    // initialise array that will hold all properties for obj
    properties = [];

    // used for tracking how much of each type of
    // property we have in the given object.
    var type_count = { 'function': 0, 'object': 0, 'html element': 0, 'array': 0, 'string': 0, 'number': 0, 'date': 0, 'regex': 0, 'boolean': 0, 'null': 0, 'storage': 0, 'audio': 0, 'image': 0, 'undefined': 0, 'constructor': 0, 'native function': 0 };

    // loop over properties in the given object
    for (var i in obj) {
      // bug in FF4.0.1 where window.storage object throws error when accessed as window['storage]
      try {
        var val = obj[i]; 
      } catch (e) {
        continue; // ignore and go on to next item
      }
      var type = realTypeOf(val);
      // add this property to our array
      properties.push({
        name: i,
        type: type
      });
      // increment our count on the types of properties
      type_count[type] += 1;
    }

    // sort properties by name
    properties.sort(function(a, b) {
      var a_name = a.name.toLowerCase();
      var b_name = b.name.toLowerCase();
      if (a_name > b_name) return 1;
      if (b_name > a_name) return -1;
      return 0;
    });

    // begin building our property list

    // add categories at top
    for (type in type_count) { // loop over our type count array
      if (type_count[type] == 0) continue; // skip this type (category) if given object had no properties of this type
      // building <li>
      var li = document.createElement("li");
      li.className = "cat";
      li.innerHTML = ['<span class="count">', type_count[type], '</span> <span>', type, 's</span>'].join('');
      addEvent(li, 'click', itemClickEvent); // click event handler
      ul.appendChild(li);	    
    }

    // add properties of given object below categories
    for (p in properties) {
      var li = document.createElement("li");
      li.innerHTML = properties[p].name;
      addEvent(li, 'click', itemClickEvent); // click event handler
      ul.appendChild(li);
    }
    return ul;
  }

  // attach click events to items in columns
  var itemClickEvent = function() {
    // determine if item clicked was a category.
    // categories and actual properties will display
    // different things when clicked
    if (hasClass(this, 'cat')) {
      var type = 'cat';
      var category = this.getElementsByTagName("span")[1].innerHTML; // determine category name
      category = category.replace(/s$/, ''); // remove any 's' at the end of category name
    } else {
      var type = 'var';
    }

    var parent = this.parentNode;

    // clicked column receives focus class
    var columns = rearwindow.columns.getElementsByTagName("div");
    // dotPath will track the object tree (?)
    var dotPath = [];
    // remove_column flag tells us at what point, if any, 
    // we should begin destroying existing columns.
    // if user was 4 columns in, and now selects something in column 2,
    // columns 3 and 4 should be removed from the DOM
    var remove_column = false;

    // loop through columns in the DOM
    for (var i=0;i<columns.length;i++) {

      var column = columns[i];

      // if remove_column is true, delete this
      // TODO should i unbind events before removing?
      if (remove_column) {
        rearwindow.columns.removeChild(column);
        i--; // decrement i, as there's one less column in the DOM now
        continue; // skip to next in loop
      }

      // if we've reached the column that received a click event
      if (column == parent.parentNode) {
        // flag this as focused. 
        // the focus class helps us to build the dotPath variable below
        addClass(parent.parentNode, "focus");
        remove_column = true; // remove all other columns after this one
        continue; // skip to next in loop
      }

      // for columns before the column that has focus
      removeClass(column, "focus"); // ensure they no longer have this class
      // determine dotPath (what object property tree has been selected)

      var children = column.getElementsByTagName("li");
      for (var j=0;j<children.length;j++) { // for each <li> in this column
        var child = children[j];
        // if this <li> has selected class, but is not a category
        if (hasClass(child, "sel") && !hasClass(child, 'cat')) {
          dotPath.push(child.innerHTML); // add to dotPath
          break;
        } 
      }
    } // end loop through columns

    // the list item clicked should receive the "selected" class
    var siblings = parent.getElementsByTagName("li");
    for (var i=0;i<siblings.length;i++) removeClass(siblings[i], "sel"); // remove selected from any siblings
    addClass(this, "sel"); // add class to this

    // add a new column. we need to determine an object to pass to 
    // addColumn(). if this is a category, this will be a new object
    // made up of properties that match the selected category.
    // if a variable property was clicked, we pass the object property tree
    // to that variable

    var new_column;
    if (type == "cat") { // if item clicked was a category
      // find all objects that match this category type, and add a column;
      var obj = eval(dotPath.join('.')); // obj becomes the selected object property tree
      var mock_obj = {};
      for (i in obj) {
        // FF 4.0.1 has a bug when accessing window.sessionStorage as window['sessionStorage']
        try {
          var val = obj[i];
          if (realTypeOf(val) == category) { // if property matches category
            mock_obj[i] = val; // add this to mock_obj
          }          
        } catch (e) {
          // do nothing
        }
      }
      new_column = addColumn(mock_obj);
    } else { // item clicked on was a variable
      // dotPath becomes the selected object property tree, plus the currently selected variable
      dotPath.push(this.innerHTML);
      new_column = addColumn(dotPath.join('.'));
    }
    
    // add this new column
    rearwindow.columns.appendChild(new_column);
//    resize();

  }	

/*  var resize = function() {
    var width = 0;
    var columns = rearwindow.columns.getElementsByTagName('div');
    // loop through columns in the DOM
    for (var i=0;i<columns.length;i++) {
      var column = columns[i];
      if (!hasClass(column, 'col')) continue;
      var styles = column.currentStyle || getComputedStyle(column, null);
      width += (parseInt(styles.width) + window.scrollBarWidth); // TODO this buffer seems to be unneccessary for FF
      console.log(parseInt(styles.width));
    }
    rearwindow.all.style.width = [width, 'px'].join('');
  } */

  /* utilities */

  var addClass = function(elem, class_name) {
    if (!hasClass(elem, class_name)) {
      elem.className += (' ' + class_name);
    }
  }

  var removeClass = function(elem, class_name) {
    var regex = new RegExp(class_name, "gim");
    elem.className = elem.className.replace(regex, '');
  }

  var hasClass = function(elem, class_name) {
    return !!elem.className.match(class_name);
  }

  // thank you Jon Combe
  // blog post http://joncom.be/code/realtypeof/
  // modified to add storage, audio, native function detection
  // and handling regex in Chrome
  var realTypeOf = function(v) {
    if (typeof(v) == 'object') {
      try {
        if (v === null) return 'null';
        if (v.constructor == (new Array).constructor) return 'array';
        if (v.constructor == (new Date).constructor) return 'date';
        if (v.constructor == (new RegExp).constructor) return 'regex';
        if (v.constructor == (new Audio).constructor) return 'audio';
        if (v.constructor == (new Image).constructor) return 'image';
        // test if this object is a dom element
        if (v.toString().match(/object\sHTML/)) return 'html element';
        // it seems impossible to tell a Storage object from a regular object, 
        // so test for storage objects the long way
        if (typeof(localStorage) != 'undefined' && v == localStorage) return 'storage';
        // when accessing sessionStorage from a file url we get 
        // NS_ERROR_DOM_NOT_SUPPORTED_ERR on FF
        if (typeof(sessionStorage) != 'undefined' && v == sessionStorage) return 'storage';
      } catch (e) {}
      // otherwise, this is an object (should always be equivalent of JSON)
      return 'object';
    }
    if (typeof(v) == 'function') {
      try {
        if (v.toString().match(/\[native\scode\]/)) return 'native function';
        if (v == (new Array).constructor) return 'constructor';
        if (v == (new Date).constructor) return 'constructor';
        if (v == (new RegExp).constructor) return 'constructor';
        if (v == (new Audio).constructor) return 'constructor';
        if (v == (new Image).constructor) return 'constructor';
        if (v == (new Option).constructor) return 'constructor';
      } catch(e) {}
      return 'function';
    }
    return typeof(v);
  }

  // thank you galambalazs
  // from http://stackoverflow.com/questions/3078584/link-element-onload/3136936#3136936
  // modified to test for display == none
  var cssOnload = function(id, callback) {
    setTimeout(function listener(){
      var el = document.getElementById(id),
      comp = el.currentStyle || getComputedStyle(el, null);
      if (comp.display === 'none') {
        document.body.removeChild(el);
        callback(); 
      }
      else 
        setTimeout(listener, 50);
    }, 50);
  }
  
  // TODO should i unbind events first?
  var closeEvent = function() {
    document.body.removeChild(window.rearwindow.all);
  }
  
  // thank you josh stodola
  // from http://stackoverflow.com/questions/986937/javascript-get-the-browsers-scrollbar-sizes
  // not always reliable, but good enough for now
/*  window.scrollBarWidth = function() {
    document.body.style.overflow = 'hidden'; 
    var width = document.body.clientWidth;
    document.body.style.overflow = 'scroll'; 
    width -= document.body.clientWidth; 
    if(!width) width = document.body.offsetWidth - document.body.clientWidth;
    document.body.style.overflow = ''; 
    return width;
  }(); // modified to evaluate straight away */

  // sets up initial two columns
  var init = function(obj) {
    // wrapper
    var rw = document.createElement('div');
    rw.id = 'rw';
    rw.style.top = [document.body.scrollTop + 20, 'px'].join('');
    // head
    var head = document.createElement('div');
    head.id = 'rw-head';
    // close button
    var b_close = document.createElement('img');
    b_close.src = 'https://github.com/lukes/rear-window.js/raw/master/lib/close.png';
    b_close.alt = 'Close';
    addEvent(b_close, 'click', closeEvent);
    head.appendChild(b_close);
    rw.appendChild(head);
    // columns
    var cols = document.createElement('div');
    cols.id = 'rw-cols';
    cols.innerHTML = ['<div class="col focus"><ul><li class="sel">', obj, '</li></ul></div>'].join('');
    // add first column
    cols.appendChild(addColumn(obj));
    rw.appendChild(cols);
    // append to body
    document.body.appendChild(rw);
    // provide a var for this DOM that for later manipulation and traversal
    window.rearwindow = { head: head, columns: cols, all: rw };
  }

  // bootstrap:

  // if rear window has already been loaded
  // remove the old before continuing
  if (typeof(window.rearwindow) != 'undefined') {
    closeEvent();
    // remove loaded css, to allow for reloading
    var old_css;
    if(old_css = document.getElementById('rw-cssloading')) {
      document.body.removeChild(old_css);
    }
  }

  // determine whether to load remote or custom css
  var css_href; 
  if (realTypeOf(options) == 'object' && options.hasOwnProperty('css')) {
    css_href = options.css;
  } else if (arguments.length == 1 && realTypeOf(initial_object) == 'object' && initial_object.hasOwnProperty('css')) {
    css_href = initial_object.css;
  } else {
    css_href = 'https://github.com/lukes/rear-window.js/raw/master/lib/rear-window.css'; // github repository
  }
    
  // load css
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = css_href;
  css.type = 'text/css';
  document.body.appendChild(css); // TODO reliable way of inserting into head?
  var cssloader = document.createElement('div');
  cssloader.id = 'rw-cssloading';
  document.body.appendChild(cssloader);
  
  // if no initial object to inspect passed as param
  // then default to window
  if (typeof(initial_object) == 'undefined' || typeof(initial_object) == 'object') {
    initial_object = 'window';
  }
  
  // when CSS has loaded, initialise the Rear Window DOM
  cssOnload('rw-cssloading', function() {
    init(initial_object);
  });

}