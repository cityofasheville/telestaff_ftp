const fs = require('fs');
const streamy = require('./streamy');
const csv = require('csv');
const datefns = require('date-fns');

const rowSource = fs.createReadStream('tmp/payroll-export--T20200305-I000-S1583427600712.csv', "utf8");

rowSource
.pipe(csv.parse({
    bom: true,
    // columns: true,
    // cast: function(value, context){ // correct data types
    //   if(context.column === "hours") {
    //       return parseFloat(value);
    //   } else if(context.column === "employeePayrollID" || context.column === 'payrollCode') {
    //       return parseInt(value, 10);
    //   } else if(context.column === "payRangeFrom") {
    //       return datefns.parse(value, "yyyy-MM-dd", new Date());
    //   } else if(context.column === 'from' || context.column === 'through') {
    //       let datestr = `${value.slice(0,19)}`
    //       return datefns.parse(datestr, "yyyy-MM-dd kk:mm:ss", new Date());
    //   } else {
    //       return value;
    //   }
    // }
  }))
  .pipe(streamy)
  .pipe(csv.stringify()).pipe(process.stdout)
  //.pipe(process.stdout);//   var upperChunk = chunk.toString().toUpperCase();


// streamy.write(['1','2','3','4'])
// streamy.write(['a','b','c','d'])
// streamy.end()