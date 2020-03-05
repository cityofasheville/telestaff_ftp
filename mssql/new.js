var debugStream = require('debug-stream')('new: ')
var fs = require('fs');
const csv = require('csv');
const { parse } = require('date-fns');
var Stream = require('stream');

var Connection = require('tedious').Connection,
TYPES = require('tedious').TYPES;

require('dotenv').config({path:'../.env'})
const config = {
  dbConfig: {
      authentication: {
          type: "default",
          options: {
              userName: process.env.sql_user, 
              password: process.env.sql_pw, 
          }
      },
      server: process.env.sql_host,
      options: {
          database: process.env.sql_db,  
          encrypt: false
      }
  },
  ftpConfig: {
          host: process.env.ftp_host,
          username: process.env.ftp_user,
          password: process.env.ftp_pw,
          path: process.env.ftp_export_path
  }
}

const table = '[avl].[telestaff_import_time]';
const filenm = '../payroll_export/output.csv';
const rowSource = fs.createReadStream(filenm, "utf8");

// connect to db
const connection = new Connection(config.dbConfig);
connection.on('connect', function(err) {
  if (err) {
    console.log('Connection Failed');
    throw err;
  }
  var option = { keepNulls: true }; // bulkLoad options
  var bulkLoad = connection.newBulkLoad(table, option, function(err, rowCont) {
    if (err) {
      connection.close();
      throw err;
    }
    console.log('rows inserted :', rowCont);
    connection.close();
  });
  // setup columns
  bulkLoad.addColumn('source', TYPES.VarChar, { length: 32, nullable: true });
  bulkLoad.addColumn('group', TYPES.VarChar, { length: 32, nullable: true });
  bulkLoad.addColumn('emp_id', TYPES.Int, { nullable: true });
  bulkLoad.addColumn('pay_code', TYPES.SmallInt, { nullable: true });
  bulkLoad.addColumn('date_worked', TYPES.Date, { nullable: true });
  bulkLoad.addColumn('hours_worked', TYPES.Float, { nullable: true });
  bulkLoad.addColumn('note', TYPES.VarChar, { length: 128, nullable: true });
  bulkLoad.addColumn('date_time_from', TYPES.DateTime, { nullable: true });
  bulkLoad.addColumn('date_time_to', TYPES.DateTime, { nullable: true });

  const rowStream = bulkLoad.getRowStream();
  connection.execBulkLoad(bulkLoad);

  rowSource
  .pipe(csv.parse({
    bom: true,
    // columns: true,
    from_line: 2,
    columns: ['source','group','emp_id','pay_code','date_worked','hours_worked','note','date_time_from','date_time_to'],
    cast: function(value, context){
      if(context.column === "hours_worked") {
        return parseFloat(value);
      } else if(context.column === "emp_id" || context.column === 'pay_code') {
        return parseInt(value, 10);
      } else if(context.column === "date_worked") {
        return parse(value, "yyyy-MM-dd", new Date());
      } else if(context.column === 'date_time_from' || context.column === 'date_time_to') {
        let datestr = `${value.slice(0,19)}`
        return parse(datestr, "yyyy-MM-dd kk:mm:ss", new Date());
      }else{
        return value;
      }
    }
  }))
  .pipe(debugStream())
  .pipe(csv.transform (function(data, callback){
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
  }))
  //.pipe(csv.stringify()).pipe(process.stdout)
  .pipe(rowStream);
});



  