let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');

const load_db = require('./load_db');

// require('dotenv').config({path:'./.env'});

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
        console.error(err);
    }
}
// if (require.main === module) { //call directly
//     Run();
// } else {
//     exports.handler = async event =>  // run as Lambda
//     await Run();
// }
// 
exports.handler = async event => await
     Run();
///////////////////////////////////////////////////////////////////////////////////////////////////////
function ftp_get(){
    return new Promise(function(resolve, reject) {

        const { host, username, password, remotepath } = ftpConfig;
        const filelist = [];

        console.log("FTP"); 

        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                console.error(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            console.error("err2" + err.level + err.description?err.description:'');
            console.error(new Error(err));
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
                console.log("Reading from FTP: " + filenm); 
                filelist.push( filenm );
                await sftp.get( remotepath + filenm, '/tmp/' + filenm );   //Download each file
            });
            Promise.all(getPromises)
            .then(async (p) => { 
                console.log(filelist);
                load_db( filelist ) // <-- load_db loads database, returns successful list so remote files can be deleted
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
                console.error("Error: " + err);
                sftp.end();
                reject(err);
            });
        })
        .catch(err => {
            console.error("Error: " + err);
            sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    console.error("Uncaught error:" + err);
});

