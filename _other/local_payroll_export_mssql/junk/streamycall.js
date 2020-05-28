const fs = require('fs');
const streamy = require('./streamy');
const csv = require('csv');

const rowSource = fs.createReadStream('tmp/payroll-export--T20200305-I000-S1583427600712.csv', "utf8");

rowSource
.pipe(csv.parse({
  bom: true,
}))
.pipe(streamy)
.pipe(csv.stringify()).pipe(process.stdout)
  //.pipe(process.stdout);//   var upperChunk = chunk.toString().toUpperCase();


