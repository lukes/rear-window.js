// TODO should I unbind every action before removing things from DOM?
// TODO can rearwindow remember the last selected path, so on reload it selects what it was last looking at?

Rear = function(initial_object) {

  // event management (thanks John Resig)
  // via blackbird.js http://www.gscottolson.com/blackbirdjs/ (thanks G. Scott Olson)
  addEvent = function ( obj, type, fn ) {
    var obj = ( obj.constructor === String ) ? document.getElementById( obj ) : obj;
    if ( obj.attachEvent ) {
      obj[ 'e' + type + fn ] = fn;
      obj[ type + fn ] = function(){ obj[ 'e' + type + fn ]( window.event ) };
      obj.attachEvent( 'on' + type, obj[ type + fn ] );
    } else obj.addEventListener( type, fn, false );
  }
  removeEvent = function ( obj, type, fn ) {
    var obj = ( obj.constructor === String ) ? document.getElementById( obj ) : obj;
    if ( obj.detachEvent ) {
      obj.detachEvent( 'on' + type, obj[ type + fn ] );
      obj[ type + fn ] = null;
    } else obj.removeEventListener( type, fn, false );
  }

  // called when a new column is added to DOM
  addColumn = function(v) {
    if (typeof(v) == "string") v = eval(v);
    var e = document.createElement("div");
    addClass(e, 'column');

    // delegate the drawing of the contents of the div
    // depending on if this column is for an object 
    // (whose properties should be listed in the column)
    // or a variable (whose value should be displayed)

    var type = realTypeOf(v);
    if (type == 'object') { // if this is an object that has properties
      contents = columnForObject(v);
    } else {
      contents = columnForVar(v, type);
    }

    e.appendChild(contents);
    return e;
  }

  // todo properly handle:
  // - arrays with objects inside them,
  // - multdimensional arrays like [[1, 2, {x:0}], 3]
  var columnForVar = function(obj, type) {
    var div = document.createElement("div");
    addClass(div, 'variable');
    var value = inspectVar(obj);
    div.innerHTML = ['<div id="type">', type, '</div><div id="value">', value, '</div>'].join('');
    return div;
  }
  
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
      case 'audio':
        return JSON.stringify({autoplay: v.autoplay, controls: v.controls, loop: v.loop, preload: v.preload, src: v.src}); 
      default:
        return v.toString();
    }
  }
  
  // can be recursively called to walk through 
  // multidimenstional arrays
  var inspectArray = function(a) {
  }

  // display the properties of the object
  // with categories at the top
  var columnForObject = function(obj) {
    var ul = document.createElement("ul");

    // initialise array that will hold all properties for obj
    properties = [];

    // used for tracking how much of each type of
    // property we have in the given object.
    var type_count = { 'function': 0, 'object': 0, 'array': 0, 'string': 0, 'number': 0, 'date': 0, 'regex': 0, 'boolean': 0, 'null': 0, 'storage': 0, 'audio': 0, 'undefined': 0, 'native function': 0 };

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
      li.className = "category";
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
    if (hasClass(this, 'category')) {
      var type = 'category';
      var category = this.getElementsByTagName("span")[1].innerHTML; // determine category name
      category = category.replace(/s$/, ''); // remove any 's' at the end of category name
    } else {
      var type = 'variable';
    }

    var parent = this.parentNode;

    // clicked column receives focus class
    var columns = rearwindow.getElementsByTagName("div");
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
        rearwindow.removeChild(column);
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
        if (hasClass(child, "selected") && !hasClass(child, 'category')) {
          dotPath.push(child.innerHTML); // add to dotPath
          break;
        } 
      }
    } // end loop through columns

    // the list item clicked should receive the "selected" class
    var siblings = parent.getElementsByTagName("li");
    for (var i=0;i<siblings.length;i++) removeClass(siblings[i], "selected"); // remove selected from any siblings
    addClass(this, "selected"); // add class to this

    // add a new column. we need to determine an object to pass to 
    // addColumn(). if this is a category, this will be a new object
    // made up of properties that match the selected category.
    // if a variable property was clicked, we pass the object property tree
    // to that variable

    if (type == "category") { // if item clicked was a category
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
      rearwindow.appendChild(addColumn(mock_obj)); // build a column for mock_obj
    } else { // item clicked on was a variable
      // dotPath becomes the selected object property tree, plus the currently selected variable
      dotPath.push(this.innerHTML);
      rearwindow.appendChild(addColumn(dotPath.join('.')));
    }
  }	

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
  var realTypeOf = function(v) {
    if (typeof(v) == 'object') {
      if (v === null) return 'null';
      if (v.constructor == (new Array).constructor) return 'array';
      if (v.constructor == (new Date).constructor) return 'date';
      if (v.constructor == (new RegExp).constructor) return 'regex';
      if (v.constructor == (new Audio).constructor) return 'audio';
      // modified to add Storage object
      // it seems impossible to tell a Storage object from a regular object, 
      // so test for storage objects the long way
      if (typeof(localStorage) != 'undefined' && v == localStorage) return 'storage';
      try {
         if (typeof(sessionStorage) != 'undefined' && v == sessionStorage) return 'storage';
      } catch (e) {
          // when accessing sessionStorage from a file url we get 
          // NS_ERROR_DOM_NOT_SUPPORTED_ERR on FF
          return 'object';
      }
      // otherwise
      return 'object';
    }
    if (typeof(v) == 'function') { // modified to include "function" (for Google Chrome at least, typeof(new RegExp) is "function")
      if (v.constructor == (new RegExp).constructor) return 'regex';
      if (v.toString().match(/\[native\scode\]/)) return 'native function';
      return 'function';
    }
    return typeof(v);
  }

  // sets up initial two columns
  var init = function(obj) {
    // create rearwindow DOM
    // TODO load CSS dynamically, allowing for user to specify their own
    // first column
    var e = document.createElement('div');
    e.id = 'rear-window';
    e.innerHTML = ['<div class="column focus"><ul><li class="selected">', obj, '</li></ul></div>'].join('');
    // list properties of obj (second column)
    e.appendChild(addColumn(obj));
    // add to DOM
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(e);
    // provide a var we can refer to for manipulation and traversal of rear window later
    window['rearwindow'] = e;
  }

  // bootstrap:

  // if rear window has already been loaded
  // remove the old before continuing
  // TODO - should i remove bound events first?
  if (typeof(window['rearwindow']) != 'undefined') {
    var body = document.getElementsByTagName('body')[0];
    body.removeChild(window['rearwindow']);
  }

  // if no initial object to inspect passed as param
  // then default to window
  if (typeof(initial_object) == 'undefined') {
    initial_object = 'window';
  }

  init(initial_object);

}