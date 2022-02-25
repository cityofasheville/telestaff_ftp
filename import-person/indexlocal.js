const { Connection, Request } = require('tedious');
let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');

require('dotenv').config({path:'./.env'})   // <<<<<<<<<<<<<<<<++++++++++++++++++=============
const dateString = (new Date()).toJSON().replace(/:/g,'-');
const config = {
    dateString,
    filesToSend: [
        {
            sqlFile: 'PersonXML.sql',
            xmlFile: `Person.xml`
        }
    ],
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
            encrypt: false,
            trustServerCertificate: false
        }
    },
    ftpConfig: {
            host: process.env.ftp_host,
            username: process.env.ftp_user,
            password: process.env.ftp_pw,
            path: process.env.ftp_import_path
    }
}

async function Run(){ 
    console.log(config.ftpConfig)  // <<<<<<<<<<<<<<<<++++++++++++++++++=============
    try {
        for (fileObj of config.filesToSend) {
            await loadAFile(fileObj);
        };
    } catch(err) {
        console.error(err);
    }
}
//exports.handler = event =>     // <<<<<<<<<<<<<<<<++++++++++++++++++=============   // <<<<<<<<<<<<<<<<++++++++++++++++++=============
     Run();

///////////////////////////////////////////////////////////////////////////////////////////////////////
function loadAFile(fileObj){
    return new Promise(function(resolve, reject) {
        const { sqlFile, xmlFile } = fileObj;
        let sqlString = fs.readFileSync(sqlFile, "utf8");
        const connection = new Connection(config.dbConfig);
        connection.on('connect', function(err) {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                console.log('DB Connected');
                const request = new Request(
                    sqlString,
                    function(err, rowCount, rows) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('XML returned');
                    }
                    connection.close();
                });
                request.on('row', function(columns) {
                    fs.writeFileSync('./tmp/' + xmlFile, columns[0].value);
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
function FtpStep(fileToSend){
    return new Promise(function(resolve, reject) {

        console.log("Sending to SFTP: " + fileToSend); 

        const { host, username, password, path } = config.ftpConfig;
        
        let readStream = fs.createReadStream('./tmp/'+fileToSend);
        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                console.error(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            console.error("err2" + err.level + err.description?err.description:'');
            console.error(new Error(err, fileToSend));
        });

        sftp.connect({
            host,
            username,
            password,
            // debug: (msg)=>{
            //     console.log(msg)
            // }
        }).then(() => {
            return sftp.put(readStream, path + config.dateString + fileToSend);
        }).then(res => {
            console.log("Sent: " + res);
            sftp.end();
            resolve(0);
        }).catch(err => {
        console.error("err3");
        console.error(err);
        sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    console.error(err);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////

