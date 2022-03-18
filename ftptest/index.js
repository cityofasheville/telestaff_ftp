
const { Client } = require('ssh2');

const { Readable, pipeline } = require("stream")
const fs = require('fs');

// For local..
require('dotenv').config({path:'./.env'})

exports.handler = async event => {
    const dateString = (new Date()).toJSON().replace(/:/g,'-');
    const xmlFile = `${dateString}TEST.xml`
    const config = {
        xmlFile,
        ftpConfig: {
            host: process.env.ftp_host,
            username: process.env.ftp_user,
            password: process.env.ftp_pw,
            path: process.env.ftp_import_path
        }
    }
    let data = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    
    `
    for(let i=0;i<10;i++){
        data += data
    }
    await sendToFtp(config,data);
}

// exports.handler({})
///////////////////////////////////////////////////////////////////////////////////////////////////////
function sendToFtp(config,data){
    return new Promise(function(resolve, reject) {
        const readablestreamdata = Readable.from([data])
        const { host, username, password, path } = config.ftpConfig;
          
        const conn = new Client();
        conn.on('ready', () => {
            conn.sftp((err, sftp) => {
                if (err) {
                    console.log(err)
                    reject()
                }
                sftp.readdir(process.env.ftp_export_path, (err, list) => {
                    if (err) reject()
                    console.dir(list);
           
                 });
                console.log("send")
                let writableftp = sftp.createWriteStream(path + config.xmlFile)
                pipeline(
                    readablestreamdata,
                    writableftp,
                    ()=>{
                        conn.end();
                        resolve()    
                    }
                )
            });
        }).connect({
            port: 22,
            host,
            username,
            password,
            readyTimeout: 900000,
            debug: (msg)=>{console.log(msg)}
        });
    });
}
