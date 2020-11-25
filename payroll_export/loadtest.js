const fs = require('fs');
const Stream = require('stream');
const csv = require('csv');
const { parse } = require('date-fns');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const { Connection, Request, TYPES } = require('tedious');



// Module test
/////////////////////////////////////////
const filelist = [ 'PD-Payroll-05-02-2020.csv','PD-Payroll-05-02-2020.csv' ];
load_db( filelist )
.then(files_to_del => {
  console.log('files_to_del',files_to_del);
}, function onReject(err) {
  console.log(err);
});
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
      let deptPromises = deptarr.map(async (dept)=>{ console.log('dept',dept) /////////////////
        let res = await load_a_dept(dept)
        console.log('res',res) /////////////////
        return res
      }); 
      console.log('deptPromises',deptPromises) /////////////////
      Promise.all(deptPromises)
      .then((dfil)=>{ 
        console.log('dfil',dfil) /////////////////
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
        .then( async (deptfiles) => {console.log('deptfiles',deptfiles) /////////////////
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
  return new Promise(async (resolve) => {      
    await require('util').promisify(setTimeout)(1000);
    console.log(`cleared table ${table} `);
    resolve() 
  })
}
//////////////////////////////
function run_stored_proc(sproc){
  return new Promise(async (resolve) => {      
    await require('util').promisify(setTimeout)(1000);
    console.log(`Stored Procedure ${sproc} Run`);
    resolve() 
  })

}
//////////////////////////////
function load_one_file( filenm, table ) {
  return new Promise(async (resolve) => {      
    await require('util').promisify(setTimeout)(1000);
    console.log(`file loaded ${filenm} ${table} `);
    resolve(filenm) 
  })

}

module.exports = load_db;
