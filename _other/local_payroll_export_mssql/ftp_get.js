
let fs = require('fs');
let ftp_connect = require('./ftp_connect');

require('dotenv').config({path:'./.env'});
///////////////////////////////////////////////////////////////////////////////////////////////////////
function ftp_get() {
    return new Promise(function(resolve, reject) {
        const filelist = [];
        const remotepath = process.env.ftp_export_path;
        let sftp = {};
        ftp_connect()
        .then((connect_sftp) => {
            sftp = connect_sftp;
            return sftp.list(remotepath); // list files
        })
        .then(data => {
            if(!data || data.length === 0) {  reject("No files on FTP") };
            let filenameList = data.map( fileObj => fileObj.name );
            let getPromises = filenameList.map(async filenm => {
                console.log("Reading from FTP: " + filenm); 
                filelist.push( filenm );
                await sftp.get( remotepath + filenm, 'tmp/' + filenm );   //Download each file
            });
            Promise.all(getPromises)
            .then(async (p) => { 
                console.log(filelist);
                sftp.end();
                resolve(filelist);
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
function del_files(files_to_del) {
    return new Promise(function(resolve, reject) {
        const remotepath = process.env.ftp_export_path;

        ftp_connect()
        .then((sftp) => {
            let delPromises = files_to_del.map(filenm => {
                return sftp.delete( remotepath + filenm );
            });
            Promise.all(delPromises)
            .then(() => {
                sftp.end();
                resolve();
            });
        });
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    ftp_get,
    del_files
};
