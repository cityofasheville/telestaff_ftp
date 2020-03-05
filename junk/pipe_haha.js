var debugStream = require('debug-stream')('lil: ')

let fs = require("fs");
const csv = require('csv');
let readStream = fs.createReadStream("output.csv");
let writeStream = fs.createWriteStream("newout.csv");

let firstLine = false;

readStream
.pipe(csv.parse( {
    bom: true,
    from_line: 2,
    cast: function(value, context){
      if(context.index === 4){
        return `${value}T00:00:00.000Z`
      }else{
        return value
      }
    }
}))
// .pipe(csv.transform (function(data){
//     if(firstLine === true) {
//         firstLine = false;
//     } else {
//         return [ 'Telestaff',data[3],data[31],data[47],data[0],data[41],data[48],data[29],data[30] ]
//     }
// }))
.pipe(debugStream())
.pipe(csv.stringify())
.pipe(process.stdout)