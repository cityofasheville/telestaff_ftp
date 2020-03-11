let fs = require("fs");
const csv = require('csv');
let readStream = fs.createReadStream("payroll-export--T20200227-I000-S1582822800661.csv");
let writeStream = fs.createWriteStream("output.csv");

let firstLine = false;

readStream
.pipe(csv.parse( {
    bom: true,
    // columns: true
}))
.pipe(csv.transform (function(data){
    if(firstLine === true) {
        firstLine = false;
    } else {
        return [ 'Telestaff',data[3],data[31],data[47],data[0],data[41],data[48],data[29],data[30] ]
    }
}))
.pipe(csv.stringify())
.pipe(writeStream)