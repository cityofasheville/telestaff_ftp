var fs = require('fs');
var Stream = require('stream');

var ws = new Stream;
ws.writable = true;
ws.bytes = '';

ws.write = function(buf) {
   ws.bytes += buf;
}

ws.end = function(buf) {
   //if(arguments.length) ws.write(buf);
   ws.writable = false;

   console.log(ws.bytes);
}

fs.createReadStream('./moo.txt').pipe(ws);