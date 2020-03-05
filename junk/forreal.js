let fs = require("fs");
const csv = require('csv')
var debugStream = require('debug-stream')('lil: ')
const { Writable } = require('stream');

let readStream = fs.createReadStream("forreal.csv");
// let writeStream = fs.createWriteStream("output.csv");

const outStream = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log(chunk.key_1);
      callback();
    }
  });

readStream
.pipe(csv.parse( {
  columns: true, // OBJECTS
//   cast: function(value, context){
//     if(context.index === 2){
//       return parseInt(value,10)
//     }else{
//       return value
//     }
//   } 
}))
.pipe(debugStream())
// .pipe(csv.stringify())
.pipe(outStream)