Marshal
=======

A library for Node.js that allows marshalling data between a master and a
client (eg, a web worker thread.)

Certain libraries, such as the `fs` Node.js library, are not available in
webworker threads.


Currently implemented
---------------------

* Web worker threads support

   The library is currently tested and working with web worker threads.  
   The appropriate Node.js package is provided in `package.json`.

   It is possible, though untested, that this library works with other
   threading packages.

* Callbacks

   Whilst true functions cannot be marshalled, callback functions can.
   Any function marshalled is registered as a callback and will be called
   with the result data.

   For example, the `fs.readFile` function can be called from a web worker
   using this library, and the error and file data will be passed to the
   client callback function.

* Buffer

  Buffers, such as those returned by `fs.readFile`, can be marshalled.  
  This library also packages a Buffer class into the worker thread.
