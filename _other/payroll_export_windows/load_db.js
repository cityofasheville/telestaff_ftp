const fs = require('fs');
const csv = require('csv');
const { parse } = require('date-fns');

const { Connection, Request, TYPES } = require('tedious');

const logit = require('./logit');

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
          encrypt: false,
          trustServerCertificate: false
      }
}
const table = '[avl].[telestaff_import_time]';

// Module test
/////////////////////////////////////////
// const filelist = [ 'Payroll-05-02-2020.csv' ];
// load_db( filelist )
// .then(files_to_del => {
//   logit('files_to_del',files_to_del[0]);
// }, function onReject(err) {
//   logit(err);
// });
/////////////////////////////////////////

function load_db( filelist ) {
  return new Promise(async function(resolve, reject) {
    try {
      await clear_table();
      let getPromises = filelist.map(async (filenm) => {
        try {
          return await load_one_file(filenm);
        }
        catch(err) {
          reject(err);
        }
      });
      Promise.all(getPromises)
      .then(async (retfiles) => {
        await run_stored_proc();
        resolve(retfiles);
      });
    }
    catch(err) {
      logit(err);
      reject(err);
    }
  });
}

function clear_table(){
  return new Promise(function(resolve, reject) {
    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        logit('DB Connection Failed: clear');
        reject(err);
      }

      request = new Request("delete from " + table, function(err, rowCount) {
        if (err) {
          logit(err);
        }
        logit("Table Cleared");
        connection.close();
        resolve();
      });
      connection.execSql(request);
    });
  });
}
//////////////////////////////
function run_stored_proc(){
  return new Promise(function(resolve, reject) {
    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        logit('DB Connection Failed: sp');
        reject(err);
      }
      request = new Request("exec [avl].[sptelestaff_insert_time]", function(err, rowCount) {
        if (err) {
          logit(err);
        }
        logit("Stored Procedure Run");
        connection.close();
        resolve();
      });
      connection.execSql(request);
    });
  });
}
//////////////////////////////
function load_one_file( filenm ) {
  return new Promise(function(resolve, reject) {
    const rowSource = fs.createReadStream('./tmp/' + filenm, "utf8");

    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        logit('DB Connection Failed: load');
        reject(err);
      }

      // bulkLoad
      var option = { keepNulls: true }; 
      var bulkLoad = connection.newBulkLoad(table, option, function(err, rowCont) {
        if(rowCont === 0) {
          connection.close();
          resolve(filenm); // file still needs to be deleted
        }
        if (err) {
          connection.close();
          reject(err);
        }
        logit('Rows Inserted: ' + rowCont, filenm);
        connection.close();
        resolve(filenm);
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
      .pipe(csv.parse({  // parse csv into object of strings
        bom: true,
        columns: true,
        cast: function(value, context){ 
          if(context.column === 'from' || context.column === 'through') {
            return `${value.slice(0,19)}`  // Telestaff date format is nonstandard '2020-05-03 08:00:00 EDT'
          } else {
            return value;
          }
        }
      }))
      .pipe(csv.transform (function(data){ // choose and rename columns : correct data types
        return { 
          source: 'Telestaff',
          group: data.institutionAbbreviation, 
          emp_id: parseInt(data.employeePayrollID, 10),
          pay_code: parseInt(data.payrollCode, 10),
          date_worked: parse(data.from, "yyyy-MM-dd kk:mm:ss", new Date() ),
          hours_worked: parseFloat(data.hours),
          note: data.rosterNote, 
          date_time_from: parse(data.from, "yyyy-MM-dd kk:mm:ss", new Date()),
          date_time_to: parse(data.through, "yyyy-MM-dd kk:mm:ss", new Date())
        } 
      }))
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
  });
}

module.exports = load_db;
