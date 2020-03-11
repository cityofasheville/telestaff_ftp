const debugStream = require('debug-stream')('new: ')
const fs = require('fs');
const csv = require('csv');
const { parse } = require('date-fns');

const Logger = require('coa-node-logging');
const logger = new Logger("Logger", 'logfile.log');

const { Connection, Request, TYPES } = require('tedious');

require('dotenv').config({path:'./.env'})
const dbConfig = {
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
}
const table = '[avl].[telestaff_import_time]';

// Module test
// const filelist = [ 'payroll-export--T20200305-I000-S1583427600712.csv', 'payroll-export--T20200304-I000-S1583341200625.csv' ];
// load_db( filelist )
// .then(files_to_del => {
//   logger.error('files_to_del',files_to_del);
// }, function onReject(err) {
//   logger.error(err);
// });

function load_db( filelist ) {
  return new Promise(function(resolve, reject) {
    clear_table();
    retnoerr = [];
    filelist.forEach((filenm) => {
      load_one_file(filenm)
      .then(file => {
        retnoerr.push(file);
      }, function onReject(err) {
        logger.error(err);
        reject(err);
      });
    });
    run_stored_proc();
    resolve(retnoerr);
  });
}

function clear_table(){
      //delete old rows from table
    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        logger.error('Connection Failed');
        reject(err);
      }
      request = new Request("delete from " + table, function(err, rowCount) {
        if (err) {
          logger.error(err);
        }
        logger.info("Table Cleared");
        connection.close();
      });
      connection.execSql(request);
    });
}

function run_stored_proc(){
  //run stored procedure on database
const connection = new Connection(dbConfig);
connection.on('connect', function(err) {
  if (err) {
    logger.error('Connection Failed');
    reject(err);
  }
  request = new Request("exec [avl].[sptelestaff_insert_time]", function(err, rowCount) {
    if (err) {
      logger.error(err);
    }
    logger.info("Stored Procedure Run");
    connection.close();
  });
  connection.execSql(request);
});
}
function load_one_file( filenm ) {
  return new Promise(function(resolve, reject) {
    const rowSource = fs.createReadStream('./tmp/' + filenm, "utf8");

    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        logger.error('Connection Failed');
        reject(err);
      }

      // bulkLoad
      var option = { keepNulls: true }; 
      var bulkLoad = connection.newBulkLoad(table, option, function(err, rowCont) {
        if (err) {
          connection.close();
          reject(err);
        }
        logger.info('Rows Inserted: ' + rowCont);
        connection.close();
      });
      // setup columns
      bulkLoad.addColumn('source', TYPES.VarChar, { length: 32, nullable: true });
      bulkLoad.addColumn('group', TYPES.VarChar, { length: 32, nullable: true });
      bulkLoad.addColumn('emp_id', TYPES.Int, { nullable: true });
      bulkLoad.addColumn('pay_code', TYPES.SmallInt, { nullable: true });
      bulkLoad.addColumn('date_worked', TYPES.Date, { nullable: true });
      bulkLoad.addColumn('hours_worked', TYPES.Decimal, { precision: 19, scale: 10, nullable: true });
      bulkLoad.addColumn('note', TYPES.VarChar, { length: 128, nullable: true });
      bulkLoad.addColumn('date_time_from', TYPES.DateTime, { nullable: true });
      bulkLoad.addColumn('date_time_to', TYPES.DateTime, { nullable: true });

      const rowStream = bulkLoad.getRowStream();
      connection.execBulkLoad(bulkLoad);

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
      }))
      // .pipe(csv.stringify()).pipe(process.stdout)
      .pipe(rowStream);
    });
    resolve(filenm);
  });
}

module.exports = load_db;
