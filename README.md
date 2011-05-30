## Rear-Window.js

Inspect your JavaScript objects

![Rear Window, Alfred Hitchcock, 1954](https://github.com/lukes/rear-window.js/raw/master/rearwindow.jpg)

Based on Mac "Column View"

![Screen Cap](https://github.com/lukes/rear-window.js/raw/master/screen.png)

    Rear()
    Rear('var')

Rear Window supports and inspects:

* Objects
* Non-native functions
* Web Storage
* Multidimensional arrays

I see `functiom [native code]` when viewing a function. This is when the function call is written in something like C, in the JavaScript engine itself, rather than is implemented in JavaScript code. To inspect these functions you'll need to view the uncompiled source code of your browser.