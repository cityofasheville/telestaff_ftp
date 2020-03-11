const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');

const Logger = require('coa-node-logging');
const logger = new Logger("Logger", 'logfile.log');

require('dotenv').config({path:'./.env'})
const dateString = (new Date()).toJSON().replace(/:/g,'-');
const config = {
    dateString,
    filesToSend: [
        {
            sqlFile: 'PersonXML.sql',
            xmlFile: `Person.xml`
        },
        {    
            sqlFile: 'StaffingXML.sql',
            xmlFile: `Staffing.xml`
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
            encrypt: false
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
    try {
        for (fileObj of config.filesToSend) {
            await loadAFile(fileObj);
        };
    } catch(err) {
        logger.error(err);
    }
}

Run();

///////////////////////////////////////////////////////////////////////////////////////////////////////
function loadAFile(fileObj){
    return new Promise(function(resolve, reject) {
        const { sqlFile, xmlFile } = fileObj;
        let sqlString = fs.readFileSync(sqlFile, "utf8");
        const connection = new Connection(config.dbConfig);
        connection.on('connect', function(err) {
            if (err) {
                logger.error(err);
                reject(err);
            } else {
                logger.info('DB Connected');
                const request = new Request(
                    sqlString,
                    function(err, rowCount, rows) {
                    if (err) {
                        logger.error(err);
                    } else {
                        logger.info('XML returned');
                    }
                    connection.close();
                });
                request.on('row', function(columns) {
                    fs.writeFileSync('tmp/' + xmlFile, columns[0].value);
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

        logger.info("Sending to SFTP: " + fileToSend); 

        const { host, username, password, path } = config.ftpConfig;
        
        let readStream = fs.createReadStream('tmp/'+fileToSend);
        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
            if(sftpError){
                logger.error(new Error("sftpError"));
            }
        });
        sftp.on('error', (err) => {
            logger.error("err2" + err.level + err.description?err.description:'');
            logger.error(new Error(err, fileToSend));
        });

        sftp.connect({
            host,
            username,
            password
        }).then(() => {
            return sftp.put(readStream, path + config.dateString + fileToSend);
        }).then(res => {
            logger.info("Sent to SFTP" + res);
            sftp.end();
            resolve(0);
        }).catch(err => {
        logger.error("err3");
        logger.error(err);
        sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    logger.error(err);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////

