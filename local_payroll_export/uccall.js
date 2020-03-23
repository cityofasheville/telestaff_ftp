const fs = require('fs');
const uc = require('./uc');

const rowSource = fs.createReadStream('tmp/payroll-export--T20200305-I000-S1583427600712.csv', "utf8");

rowSource.pipe(uc).pipe(process.stdout);//   var upperChunk = chunk.toString().toUpperCase();