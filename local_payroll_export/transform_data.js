const debugStream = require('debug-stream')('new: ')
const fs = require('fs');
const csv = require('csv');
const { parse } = require('date-fns');



const transform_data = async function (rowSource) {
    rowSource
    .pipe(csv.parse({
      bom: true,
      columns: true,
      cast: function(value, context){ // correct data types
        if(context.column === "hours") {
            return parseFloat(value);
        } else if(context.column === "employeePayrollID" || context.column === 'payrollCode') {
            return parseInt(value, 10);
        } else if(context.column === "payRangeFrom") {
            return parse(value, "yyyy-MM-dd", new Date());
        } else if(context.column === 'from' || context.column === 'through') {
            let datestr = `${value.slice(0,19)}`
            return parse(datestr, "yyyy-MM-dd kk:mm:ss", new Date());
        } else {
            return value;
        }
      }
    }))
    .pipe(csv.transform (function(data){ // choose and rename columns
      return { 
        source: 'Telestaff',
        group: data.institutionAbbreviation, 
        emp_id: data.employeePayrollID,
        pay_code: data.payrollCode,
        date_worked: data.payRangeFrom,
        hours_worked: data.hours,
        note: data.rosterNote, 
        date_time_from: data.from, 
        date_time_to: data.through
      } 
    }))
    .pipe(debugStream())
    .pipe(csv.transform (function(data, callback){ //reject bad data
        if(
          typeof(data.source) === "string" && 
          typeof(data.group) === "string" && 
          typeof(data.emp_id) === "number" && 
          typeof(data.pay_code) === "number" && !isNaN(data.pay_code) &&
          !isNaN(data.date_worked) &&
          typeof(data.hours_worked) === "number" && 
          typeof(data.note) === "string" && 
          !isNaN(data.date_time_from) &&
          !isNaN(data.date_time_to)
          // Strings: typeof
          // Numbers: typeof but also check for NaN
          // Dates: date-fns will return NaN if invalid date
          //Object.prototype.toString.call(data.date_time_to) === '[object Date]' && 
        ) {
            let retdata = [ 
              data.source, 
              data.group, 
              data.emp_id, 
              data.pay_code, 
              data.date_worked, 
              data.hours_worked, 
              data.note, 
              data.date_time_from, 
              data.date_time_to 
            ]
            callback(null, retdata);
          } else {
            callback(null, null);
          }

    }, {
      parallel: 20
    }));
    // .pipe(csv.stringify()).pipe(return)
    // .pipe(rowStream);

}

// module.exports = transform_data;
// Module test
const rowSource = fs.createReadStream('tmp/payroll-export--T20200305-I000-S1583427600712.csv', "utf8");
transform_data( rowSource )
.then(files_to_del => {
  console.log('files_to_del',files_to_del);
}, function onReject(err) {
  console.error(err);
});