## Rear-Window.js

Inspect your JavaScript objects

![Rear Window, Alfred Hitchcock, 1954](https://github.com/lukes/rear-window.js/raw/master/dev/rearwindow.jpg)

Based on Mac "Column View"

![Screen Cap](https://github.com/lukes/rear-window.js/raw/master/dev/screen.png)

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

### Huh?

#### You have a "Native Function" variable type?

This is when the function is written in something like C, in the JavaScript engine itself, rather than is implemented in JavaScript code. To inspect these functions you'll need to view the uncompiled browser's source code.