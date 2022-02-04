const { Connection, Request } = require('tedious');
const { Client } = require('ssh2');
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
// exports.handler = event =>     // <<<<<<<<<<<<<<<<++++++++++++++++++=============   // <<<<<<<<<<<<<<<<++++++++++++++++++=============
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
                        reject(err);
                    } else {
                        console.log('XML returned');
                    }
                    connection.close();
                });
                request.on('row', function(columns) {
                    fs.writeFileSync('./tmp/' + xmlFile, columns[0].value);
                });
                request.on('requestCompleted', async function (rowCount, more, rows) { 
                    let ret = await FtpStep(xmlFile)
                    console.log("db req complete")
                    resolve(ret);
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
                sftp.fastPut('./tmp/' + fileToSend, path + config.dateString + fileToSend, {}, (err, ret)=>{
                    if (err) reject()
                    console.log("ret", ret)
                    conn.end();
                    resolve()
                  }) // , "< object >options", "< function >callback")
            });
        }).connect({
            port: 22,
            host,
            username,
            password,
            readyTimeout: 90000
        });
    });
}
``
