## Rear-Window.js

Inspect your JavaScript objects

![Rear Window, Alfred Hitchcock, 1954](https://github.com/lukes/rear-window.js/raw/master/rearwindow.jpg)

Based on Mac "Column View"

![Screen Cap](https://github.com/lukes/rear-window.js/raw/master/screen.png)

### Usage

    Rear()
    Rear('var') // inspect this variable

Rear Window supports and inspects:

* Objects
* Non-native functions
* Web Storage
* Multidimensional arrays
* Regular expressions
* Audio objects
* Date
* Strings, Numbers, Booleans, and null and undefined variables

### Eh?

#### What are Native Functions? 

This is when the function is written in something like C, in the JavaScript engine itself, rather than is implemented in JavaScript code. To inspect these functions you'll need to view the uncompiled source code of your browser.