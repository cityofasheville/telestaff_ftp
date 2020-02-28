const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;
let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');
const readline = require('readline');
const path = require('path');

require('dotenv').config({path:'./.env'})
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

let logFile = fs.createWriteStream('logfile.log');

async function Run(){
    try {
        await FtpStep();
    } catch(err) {
        logit(err);
    }
}

Run();

///////////////////////////////////////////////////////////////////////////////////////////////////////
function FtpStep(){
    return new Promise(function(resolve, reject) {

        logit("Reading from SFTP: " + config.ftpConfig.username); 

        const { host, username, password, path } = config.ftpConfig;
        
        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                logit(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            logit("err2",err.level, err.description?err.description:'');
            logit(new Error(err));
        });

        sftp.connect({
            host,
            username,
            password
        })
        .then(() => {
            return sftp.list(path);
        })
        .then(data => {
            filenameList = data.map(fileObj => fileObj.name);
            promiseList = filenameList.map(async filenm => {
                // await sftp.fastGet(path + filenm, './tmp/' + filenm);
                // await sftp.delete(path + filenm);
                // return loadDB('./tmp/' + filenm);
                return loadDB('./tmp/payroll-export--T20200226-I000-S1582736400532.csv');
            });

            Promise.all(promiseList)
            .then(() => {
                sftp.end();
                resolve(0);
            })
            .catch(err => {
                logit("Error:", err);
                sftp.end();
                reject(err);
            });
        })
        .catch(err => {
            logit("Error:", err);
            sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
function loadDB(filenm){
    let firstLine = true;
    return new Promise(function(resolve, reject) {
        const connection = new Connection(config.dbConfig);
        connection.on('connect', function(err) {
            if (err) {
                logit(err);
                reject(err);
            } else {
                logit('DB Connected');
                let requestdel = new Request("DELETE FROM [avl].[telestaff_import_time]", 
                    function(err) { if(err) { console.log(err); }; }
                );
                connection.execSql(requestdel);

                let bulkLoad = connection.newBulkLoad('avl.telestaff_import_time', null, function (error, rowCount) {
                    console.log('inserted %d rows', rowCount);
                  });
                bulkLoad.addColumn('source', TYPES.VarChar, { length: 32, nullable: true });
                // bulkLoad.addColumn('group', TYPES.VarChar, { length: 32, nullable: true });
                // bulkLoad.addColumn('emp_id', TYPES.Int, { nullable: true });
                // bulkLoad.addColumn('pay_code', TYPES.Int, { nullable: true });
                // bulkLoad.addColumn('date_worked', TYPES.Date, { nullable: true });
                // bulkLoad.addColumn('hours_worked', TYPES.Decimal, { nullable: true });
                // bulkLoad.addColumn('note', TYPES.VarChar, { length: 128, nullable: true });
                // bulkLoad.addColumn('date_time_from', TYPES.DateTime, { nullable: true });
                // bulkLoad.addColumn('date_time_to', TYPES.DateTime, { nullable: true });

                let rl = readline.createInterface({
                    input: fs.createReadStream(filenm, "utf8"),
                });
                rl.on('line', (line) => {
                    let fields = line.split(','); // split into array

                    if(firstLine === true) {
                        firstLine = false;
                    //} else {

                        bulkLoad.addRow({source: 'Telestaff'});
                        // group:          'x',
                        // emp_id:         123,
                        // pay_code:       123,
                        // date_worked:    '2020-02-20',
                        // hours_worked:   123,
                        // note:           'asddsa',
                        // date_time_from: '2020-02-20',
                        // date_time_to:   '2020-02-20'
                        //                 //  group:          strip(fields[3]),
                        //                 //  emp_id:         strip(fields[31]),
                        //                 //  pay_code:       strip(fields[47]),
                        //                 //  date_worked:    strip(fields[0]),
                        //                 //  hours_worked:   strip(fields[41]),
                        //                 //  note:           strip(fields[48]),
                        //                 //  date_time_from: strip(fields[29]),
                        //                 //  date_time_to:   strip(fields[30])
                        // });


                        // let request = new Request(
                        //     "INSERT INTO avl.telestaff_import_time "
                        //     + "(source,group,emp_id,pay_code,date_worked,hours_worked,note,date_time_from,date_time_to) "
                        //     + "VALUES (@source, @group, @emp_id, @pay_code, @date_worked, @hours_worked, @note, @date_time_from, @date_time_to)", 
                        //     function(err) { if(err) { console.log(err); }; 
                        // });

                        // request.addParameter('source', TYPES.VarChar, 'Telestaff');
                        // request.addParameter('group', TYPES.VarChar, strip(fields[3]));
                        // request.addParameter('emp_id', TYPES.Int, strip(fields[31]));
                        // request.addParameter('pay_code', TYPES.Int, strip(fields[47]));
                        // request.addParameter('date_worked', TYPES.Date, strip(fields[0]));
                        // request.addParameter('hours_worked', TYPES.Decimal, strip(fields[41]));
                        // request.addParameter('note', TYPES.VarChar, strip(fields[48]));
                        // request.addParameter('date_time_from', TYPES.DateTime, strip(fields[29]));
                        // request.addParameter('date_time_to', TYPES.DateTime, strip(fields[30]));
                        // connection.execSql(request);                   
                    }
                }).on('close', () => {
                    connection.execBulkLoad(bulkLoad);
                    connection.close();
                });
            };
        });
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
function strip(str) {
    if (str.charAt(0) === '"' && str.charAt(str.length -1) === '"') {
        return str.substr(1,str.length - 2);
    } else {
        return str;
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    logit("Uncaught error:",err);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////
function logit(msg){
    console.log(msg);
    logFile.write(msg + '\n');
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
