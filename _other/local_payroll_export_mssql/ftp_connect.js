
let FTPClient = require('ssh2-sftp-client');

require('dotenv').config({path:'./.env'});

function ftp_connect() {
    return new Promise(function(resolve, reject) {    
        const ftpConfig = {
            host: process.env.ftp_host,
            username: process.env.ftp_user,
            password: process.env.ftp_pw,
        }

        const { host, username, password } = ftpConfig;

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
        .then(()=>{
            resolve(sftp) ;
        });
    });
}

module.exports = ftp_connect;