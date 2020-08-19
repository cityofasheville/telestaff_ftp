let FTPClient = require('ssh2-sftp-client');

const load_db = require('./load_db');
const logit = require('./logit');

require('dotenv').config({path:'./.env'});
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
        logit(err);
    }
}
// if (require.main === module) { //call directly
//     Run();
// } else {
//     exports.handler = async event =>  // run as Lambda
//     await Run();
// }
// 
// exports.handler = async event => await
    if( payrollweek() ) {
        Run();
    } else {
        console.log("Don't run: today is not payroll week")
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////
function ftp_get(){
    return new Promise(function(resolve, reject) {

        const { host, username, password, remotepath } = ftpConfig;
        const filelist = [];

        logit("Reading from SFTP: " + ftpConfig.host); 

        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                logit(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            logit("err2" + err.level + err.description?err.description:'');
            logit(new Error(err));
        });

        sftp.connect({
            host,
            username,
            password
        })
        .then(() => {
            return sftp.list(remotepath);  // List files
        })
        .then(data => {
            let filenameList = data.map( fileObj => fileObj.name );
            let getPromises = filenameList.map(async filenm => {
                logit("Reading from FTP: " + filenm); 
                filelist.push( filenm );
                await sftp.get( remotepath + filenm, './tmp/' + filenm );   //Download each file
            });
            Promise.all(getPromises)
            .then(async () => { // load_db loads database, returns successful list so remote files can be deleted
                logit(filelist);
                load_db( filelist )
                .then(files_to_del => {
                    let delPromises = files_to_del.map(async filenm => {
                        logit("Files deleted from FTP: " + filenm);
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
                logit("Error: " + err);
                sftp.end();
                reject(err);
            });
        })
        .catch(err => {
            logit("Error: " + err);
            sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    logit("Uncaught error:" + err);
});
