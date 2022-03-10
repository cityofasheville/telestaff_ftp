const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const s3_client = new S3Client({ region: 'us-east-1' })
const fs = require('fs');
const Stream = require('stream');
const csv = require('csv');
const sql = require('mssql')

const load_one_file = require('./load_one_file');

require('dotenv').config({path:'./.env'})   // <============ for local run './.env', for lambda, '/.env/' (or comment whole line)

// Module test
/////////////////////////////////////////
// const filelist = [ 'PD-Payroll-Export--T20220304-I000-S1646403358752.csv' ];
// load_db( filelist )
// .then(files_to_del => {
//   console.log('files_to_del',files_to_del);
// }, function onReject(err) {
//   console.log(err);
// });
/////////////////////////////////////////

async function load_db(filelist) {
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
  try {
      // categorize files as PD or FD
      filelist.map((filenm) => {
          if (filenm.charAt(0) === "P") {        // Police
              depts.Police.files.push(filenm)
          } else if (filenm.charAt(0) === "F") {  // Fire
              depts.Fire.files.push(filenm)
          }
      })        
      let deptarr = Object.values(depts)

      // Load each of FD/PD: using reduce to call async func sequentially
      const call_load_a_dept = async (previous, dept) => {
          await previous;
          return load_a_dept(dept,dbConfig);
      };
      let dfil = await deptarr.reduce(call_load_a_dept, Promise.resolve())

      return filelist
  }
  catch (err) {
      console.log(err);
      reject(err);
  }
}

async function load_a_dept(dept, dbConfig) { // for each of FD/PD, clear table, load all files, run sp
  try {
    if(dept.files.length == 0) return

    await clear_table(dept.tablenm, dbConfig);

    // Load each file: using reduce to call async func sequentially
    const call_load_one_file = async (previous, deptfilenm) => {
        await previous;
        return load_one_file(deptfilenm, dept.tablenm, dbConfig);
    };
    let deptfiles = await dept.files.reduce(call_load_one_file, Promise.resolve())
    await run_stored_proc(dept.sproc, dbConfig);
    return
  }
  catch (err) {
      console.log(err);
      throw (err);
  }
}

// async function load_one_file(filenm, tablenm, dbConfig){
//   console.log("load_one_file ",tablenm, "fake: ")
//   return filenm
// }

async function clear_table(tablenm,dbConfig){
  try{
    await sql.connect(dbConfig)
    const result = await sql.query("delete from " + tablenm)
    // sql.close()

    console.log("Clear table ",tablenm, "Result: ", result.rowsAffected)
  } catch (err){
    console.log(err)
  }
}

async function run_stored_proc(sproc,dbConfig){
  try{
    await sql.connect(dbConfig)
    const result = await sql.query("execute " + sproc)
    // sql.close()

    console.log("Stored Procedure ", sproc, "Result: ", result.rowsAffected);
  } catch (err){
    console.log(err)
  }
}

module.exports = load_db;
