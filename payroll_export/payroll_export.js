const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');
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
                await sftp.fastGet(path + filenm, './tmp/' + filenm);
                await sftp.delete(path + filenm);
                return loadDB(filenm);
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
function loadDB(fileObj){
    return Promise.resolve(0);
    return new Promise(function(resolve, reject) {
        const { sqlFile, xmlFile } = fileObj;
        let sqlString = fs.readFileSync(sqlFile, "utf8");
        const connection = new Connection(config.dbConfig);
        connection.on('connect', function(err) {
            if (err) {
                logit(err);
                reject(err);
            } else {
                logit('DB Connected');
                const request = new Request(
                    sqlString,
                    function(err, rowCount, rows) {
                    if (err) {
                        logit(err);
                    } else {
                        logit('XML returned');
                    }
                    connection.close();
                });
                request.on('row', function(columns) {
                    fs.writeFileSync('tmp/' + xmlFile, columns[0].value);
                });
                request.on('requestCompleted', function (rowCount, more, rows) { 
                    resolve(FtpStep(xmlFile));;
                });
                connection.execSql(request);
            }
        });
    });
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
