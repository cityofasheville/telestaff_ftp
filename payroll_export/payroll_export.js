let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');
const Logger = require('coa-node-logging');
const logger = new Logger("Logger", 'logfile.log');

const load_db = require('./load_db');

require('dotenv').config({path:'../.env'});

const ftpConfig = {
    host: process.env.ftp_host,
    username: process.env.ftp_user,
    password: process.env.ftp_pw,
    remotepath: process.env.ftp_export_path
}

let logFile = fs.createWriteStream('logfile.log');

async function Run(){
    try {
        await ftp_get();
    } catch(err) {
        logger.error(err);
    }
}

Run();

///////////////////////////////////////////////////////////////////////////////////////////////////////
function ftp_get(){
    return new Promise(function(resolve, reject) {

        const { host, username, password, remotepath } = ftpConfig;
        const filelist = [];

        logger.info("Reading from SFTP: " + ftpConfig.host); 

        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                logger.error(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            logger.error("err2" + err.level + err.description?err.description:'');
            logger.error(new Error(err));
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
                filelist.push( filenm );
                return await sftp.fastGet( remotepath + filenm, './tmp/' + filenm );   //Download each file
            });
            Promise.all(getPromises)
            .then(async () => { // load_db loads database, returns successful list so remote files can be deleted
                logger.info(filelist);
                load_db( filelist )
                .then(files_to_del => {
                    let delPromises = files_to_del.map(filenm => {
                        return sftp.delete( remotepath + filenm );
                    })
                    Promise.all(delPromises)
                    .then(() => {
                        sftp.end();
                        resolve(0);
                    });                
                })                 
            })
            .catch(err => {
                logger.error("Error: " + err);
                sftp.end();
                reject(err);
            });
        })
        .catch(err => {
            logger.error("Error: " + err);
            sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    logger.error("Uncaught error:" + err);
});

