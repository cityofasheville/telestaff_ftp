const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const s3_client = new S3Client({ region: 'us-east-1' })
const fs = require('fs');
const Stream = require('stream');
const csv = require('csv');
const sql = require('mssql')

const load_one_file = require('./load_one_file');

require('dotenv').config({path:'./.env'})   // <============ for local run './.env', for lambda, '/.env/' (or comment whole line)
const dbConfig = {
  user: process.env.sql_user,
  password: process.env.sql_pw,
  database: process.env.sql_db,
  server: process.env.sql_host,
  connectionTimeout: 90000,
  requestTimeout: 90000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 90000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: true // change to true for local dev / self-signed certs
  }
}


// Module test
/////////////////////////////////////////
// const filelist = [ 'PD-Payroll-Export--T20220204-I000-S1643988495284.csv' ];
// load_db( filelist )
// .then(files_to_del => {
//   console.log('files_to_del',files_to_del);
// }, function onReject(err) {
//   console.log(err);
// });
/////////////////////////////////////////

function load_db( filelist ) {
  const depts = 
  {
    "Police": {
      tablenm: 'avl.telestaff_import_time_apd',
      sproc: 'avl.sptelestaff_insert_time_apd',
      files: []
    },
    "Fire": {
      tablenm: 'avl.telestaff_import_time',
      sproc: 'avl.sptelestaff_insert_time',
      files: []
    }
  }
  return new Promise(function(resolve, reject) {
    try {                                                   console.log("here1",filelist)
      sql.connect(dbConfig)
      .then((conn)=>{                                       console.log("here1.5")
        filelist.map((filenm) => {
          if(filenm.charAt(0)==="P"){        // Police
            depts.Police.files.push(filenm)
          }else if(filenm.charAt(0)==="F"){  // Fire
            depts.Fire.files.push(filenm)
          }
        })
        let deptarr = Object.values(depts)
        let deptPromises = deptarr.map(async (dept)=>{              console.log("here2",dept)
          return await load_a_dept(dept,sql)
        })
        Promise.all(deptPromises)
        .then((dfil)=>{                                             console.log("here3-dbclose",dfil)
          // conn.close()
          resolve(dfil.flat())
        })
      })
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  });
}

async function load_a_dept( dept,sql ) { // for each of FD/PD, clear table, load all files, run sp
  try {
    if (dept.files.length > 0){
      await clear_table(dept.tablenm,sql);
      let getPromises = dept.files.map(async (deptfilenm) => {
        return await load_one_file(deptfilenm,dept.tablenm,sql);
      })
      Promise.all(getPromises)
      .then( async (deptfiles) => {
        await run_stored_proc(dept.sproc,sql);
        return(deptfiles);
      });
    } else {
      return([])
    }
  }
  catch(err) {
    console.log(err);
    throw(err);
  }
}

async function clear_table(tablenm,sql){
  try{
    // await sql.connect(dbConfig)

    const result = await sql.query("delete from " + tablenm)
    console.log("Clear table " + tablenm + ". Rows affected: " + result.rowsAffected)
  } catch (err){
    console.log(err)
  }
}

async function run_stored_proc(sproc,sql){
  try{
    // await sql.connect(dbConfig)

    const result = await sql.query("execute " + sproc)

    console.dir(result)
    console.log(`Stored Procedure ${sproc} Run`);
  } catch (err){
    console.log(err)
  }
}

module.exports = load_db;
