const fs = require('fs');
const tr = require('./tr');

const rowSource = fs.createReadStream('tr.json', "utf8");

rowSource.pipe(tr).pipe(process.stdout);//   var upperChunk = chunk.toString().toUpperCase();