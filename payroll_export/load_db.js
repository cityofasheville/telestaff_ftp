const fs = require('fs');
const Stream = require('stream');
const csv = require('csv');
const { parse } = require('date-fns');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const { Connection, Request, TYPES } = require('tedious');

require('dotenv').config({path:'/.env'})   // <============ for local run './.env', for lambda, '/.env/' (or comment whole line)
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
          connectionTimeout: 30000,
          requestTimeout: 680000,
          encrypt: false,
          trustServerCertificate: false
      }
}

// Module test
/////////////////////////////////////////
// const filelist = [ 'Payroll-05-02-2020.csv' ];
// load_db( filelist )
// .then(files_to_del => {
//   console.log('files_to_del',files_to_del[0]);
// }, function onReject(err) {
//   console.log(err);
// });
/////////////////////////////////////////

function load_db( filelist ) {
  const depts = 
  {
    "Police": {
      table: 'avl.telestaff_import_time_apd',
      sproc: 'avl.sptelestaff_insert_time_apd',
      files: []
    },
    "Fire": {
      table: 'avl.telestaff_import_time',
      sproc: 'avl.sptelestaff_insert_time',
      files: []
    }
  }
  return new Promise(async function(resolve, reject) {
    try {
      filelist.map((filenm) => {
        if(filenm.charAt(0)==="P"){        // Police
          depts.Police.files.push(filenm)
        }else if(filenm.charAt(0)==="F"){  // Fire
          depts.Fire.files.push(filenm)
        }
      })
      let deptarr = Object.values(depts)
      let deptPromises = deptarr.map(async (dept)=>{
        return await load_a_dept(dept)
      })
      Promise.all(deptPromises)
      .then((dfil)=>{
        resolve(dfil.flat())
      })
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  });
}

function load_a_dept( dept ) {
  return new Promise(async function(resolve, reject) {
    try {
      if (dept.files.length > 0){
        await clear_table(dept.table);
        let getPromises = dept.files.map(async (deptfilenm) => {
          return await load_one_file(deptfilenm,dept.table);
        })
        Promise.all(getPromises)
        .then( async (deptfiles) => {
          await run_stored_proc(dept.sproc);
          resolve(deptfiles);
        });
      } else {
        resolve([])
      }
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
}

function clear_table(table){
  return new Promise(function(resolve, reject) {
    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        console.log('DB Connection Failed: clear');
        reject(err);
      }

      request = new Request("delete from " + table, function(err, rowCount) {
        if (err) {
          console.log(err);
          connection.close();
          reject(err);
        }
        console.log(`Table ${table} Cleared`);
        connection.close();
        resolve();
      });
      connection.execSql(request);
    });
  });
}
//////////////////////////////
function run_stored_proc(sproc){
  return new Promise(function(resolve, reject) {
    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        console.log('DB Connection Failed: sp');
        reject(err);
      }
      request = new Request("exec " + sproc, function(err, rowCount) {     // <============ stored procedure name: sptelestaff_insert_time
        if (err) {
          console.log(err);
          connection.close();
          reject(err);
        }
        console.log(`Stored Procedure ${sproc} Run`);
        connection.close();
        resolve();
      });
      connection.execSql(request);
    });
  });
}
//////////////////////////////
function s3_writable_stream(filename){
  let ws = new Stream;
  ws.writable = true;
  let file_content = '';

  ws.write = function(buf) {
    file_content += buf;
  }

  ws.end = function(buf) {
    let s3_bucket_name = "telestaff-ftp-backup"
    if(arguments.length) ws.write(buf);
    const s3_params = {
      Bucket: s3_bucket_name,
      Key: filename,
      Body: file_content,
      ContentType: "text/csv"
    };
    s3.putObject(s3_params).promise();
    ws.writable = false;
    console.log(`Copy of file ${filename} is stored in S3: ${s3_bucket_name}`)
  }
  return ws;
}
//////////////////////////////
function load_one_file( filenm, table ) {
  return new Promise(function(resolve, reject) {
    const rowSource = fs.createReadStream('/tmp/' + filenm, "utf8");    // <============ for local run './tmp/', for lambda, '/tmp/'

    const connection = new Connection(dbConfig);
    connection.on('connect', function(err) {
      if (err) {
        console.log('DB Connection Failed: load');
        reject(err);
      }

      // bulkLoad
      var option = { keepNulls: true }; 
      var bulkLoad = connection.newBulkLoad(table, option, function(err, rowCont) {
        if(rowCont === 0) {
          connection.close();
          resolve(filenm); // file on ftp still needs to be deleted
        }
        if (err) {
          console.log("Load error", err)
          connection.close();
          reject(err);
        }
        console.log('Rows Inserted: ' + rowCont, filenm, table);
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
      .pipe(
        s3_writable_stream( filenm )
      );

      rowSource
      .pipe(csv.parse({  // parse csv into object of strings
        bom: true,
        columns: true,
        cast: function(value, context){ 
          if(context.column === 'from') {
              return value.replace(' 00:',' 24:')            // "from" date format is '2020-05-03 8:00:00' 
          } else if(context.column === 'through') {
              return value.replace(' 00:',' 24:').slice(0,19) // "to" date format is '2020-05-03 08:00:00 EDT' 
          } else {
              return value;
          }
        }
      }))
      .pipe(csv.transform (function(data){ // choose and rename columns : correct data types
        return { 
          source: 'Telestaff',
          group: data.institutionAbbreviation.substr(0,32), 
          emp_id: parseInt(data.employeePayrollID, 10),
          pay_code: parseInt(data.payrollCode, 10),
          date_worked: parse(data.from, "yyyy-MM-dd kk:mm:ss", new Date() ),
          hours_worked: parseFloat(data.hours),
          note: data.rosterNote.substr(0,128),
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
