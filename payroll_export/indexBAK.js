let FTPClient = require('ssh2-sftp-client');

const load_db = require('./load_db');

require('dotenv').config({path:'/.env'});
let payrollweek = require('./payrollweek')

const ftpConfig = {
    host: process.env.ftp_host,
    username: process.env.ftp_user,
    password: process.env.ftp_pw,
    remotepath: process.env.ftp_export_path
}

async function Run(){
    try {
        await ftp_get();
    } catch(err) {
        console.log(err);
    }
}

// To Test, you can set process.env.payrollweek=both and it will always run
// Normally Payroll Export should be run on Payroll week, so set process.env.payrollweek=pay
// This has changed. APD wants payroll export on "not" payroll week Friday
exports.handler = async (event) => {
    if( process.env.payrollweek === 'both' || 
        (payrollweek() && process.env.payrollweek === 'pay') ||
        (!payrollweek() && process.env.payrollweek === 'not')
        ) {
        await Run();
    } else {
        console.log("Don't run: today is not payroll week")
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
function ftp_get(){
    return new Promise(function(resolve, reject) {

        const { host, username, password, remotepath } = ftpConfig;
        const filelist = [];

        console.log("Reading from SFTP: " + ftpConfig.host); 

        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                console.log(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            console.log("err2" + err.level + err.description?err.description:'');
            console.log(new Error(err));
        });

        sftp.connect({
            host,
            username,
            password,
            debug: (msg)=>{
                console.log(msg)
            },
            readyTimeout: 99999
        })
        .then(() => {
            return sftp.list(remotepath);  // List files
        })
        .then(data => {
            let filenameList = data
                .map( fileObj => fileObj.name )
                .filter( filenm => filenm !== "payroll-report-export.csv" )
                .filter( filenm => filenm !== "APD-daily-payroll-export.csv" );
            let getPromises = filenameList.map(async filenm => {
                console.log("Reading from FTP: " + filenm); 
                filelist.push( filenm );
                await sftp.get( remotepath + filenm, './tmp/' + filenm );   //Download each file
            });
            Promise.all(getPromises)
            .then(async () => { // load_db loads database, returns successful list so remote files can be deleted
                console.log(filelist);
                load_db( filelist )
                .then(files_to_del => {
                    let delPromises = files_to_del.map(async filenm => {
                        console.log("Files deleted from FTP: " + filenm);
                        await sftp.delete( remotepath + filenm );
                        return filenm;
                    })
                    Promise.all(delPromises)
                    .then((filenms) => {
                        sftp.end();
                        resolve(0);
                    });                
                })                 
            })
            .catch(err => {
                console.log("Error: " + err);
                sftp.end();
                reject(err);
            });
        })
        .catch(err => {
            console.log("Error: " + err);
            sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    console.log("Uncaught error:" + err);
});
