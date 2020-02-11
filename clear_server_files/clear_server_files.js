let FTPClient = require('ssh2-sftp-client');

require('dotenv').config({path:'../.env'})


const host = process.env.ftp_host;
const username = process.env.ftp_user;
const password = process.env.ftp_pw;
const paths_to_clear = [
    '/DEV/export/payroll/'
]

logit("Clearing files"); 

let sftp = new FTPClient();
sftp.on('close', (sftpError) => {
if(sftpError){
    logit(new Error("sftpError"));
}
});
sftp.on('error', (err) => {
    logit("err2",err.level, err.description?err.description:'');
});

sftp.connect({
    host,
    username,
    password
}).then(() => {
    return paths_to_clear.map(path => { //returns array of promises
        return new Promise(function(resolve, reject) {
            sftp.list(path)
            .then(files => {
                return files.map(file => { //returns array of promises
                    return new Promise(function(resolve, reject) {
                        sftp.delete(path + file.name)
                        .then(() => {
                            resolve(path + file.name);
                        });
                    });
                });
            })
            .then(actions => {
                let results = Promise.all(actions);
                resolve(results);
            });
        });
    });
}).then(actions => {
    return Promise.all(actions);
}).then(data => {
    logit(data);
}).then(res => {
    logit("Done", res);
    sftp.end();
    // resolve(0);
}).catch(err => {
logit("err3");
logit(err);
sftp.end();
});


///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    logit(err);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////
function logit(msg){
    console.log(msg);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////

