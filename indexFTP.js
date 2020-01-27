
let FTPClient = require('ssh2-sftp-client');
var fs = require('fs');

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
            path: process.env.ftp_path
    }
}

let logFile = fs.createWriteStream('logfile.log');

async function Run(){
    try {
        for (fileObj of config.filesToSend) {
            const { xmlFile } = fileObj;
            await FtpStep(xmlFile)
        };
    } catch(err) {
        logit(err);
    }
}

Run();

///////////////////////////////////////////////////////////////////////////////////////////////////////
// function loadAFile(fileObj){
//     return new Promise(function(resolve, reject) {
//         const { sqlFile, xmlFile } = fileObj;
//         let sqlString = fs.readFileSync(sqlFile, "utf8");
//         const connection = new Connection(config.dbConfig);
//         connection.on('connect', function(err) {
//             if (err) {
//                 logit(err);
//                 reject(err);
//             } else {
//                 logit('DB Connected');
//                 const request = new Request(
//                     sqlString,
//                     function(err, rowCount, rows) {
//                     if (err) {
//                         logit(err);
//                     } else {
//                         logit('XML returned');
//                     }
//                     connection.close();
//                 });
//                 request.on('row', function(columns) {
//                     fs.writeFileSync('tmp/' + xmlFile, columns[0].value);
//                 });
//                 request.on('requestCompleted', function (rowCount, more, rows) { 
//                     resolve(FtpStep(xmlFile));;
//                 });
//                 connection.execSql(request);
//             }
//         });
//     });
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////
function FtpStep(fileToSend){
    return new Promise(function(resolve, reject) {

        logit("Sending to SFTP: " + fileToSend); 

        const { host, username, password, path } = config.ftpConfig;
        
        let readStream = fs.createReadStream('tmp/'+fileToSend);
        let sftp = new FTPClient();
        sftp.on('close', (sftpError) => {
        if(sftpError){
            logit(new Error("sftpError"));
        }
        });
        sftp.on('error', (err) => {
        logit("err2",err.level, err.description?err.description:'');
        logit(new Error(err, fileToSend));
        });

        sftp.connect({
            host,
            username,
            password
        }).then(() => {
            return sftp.put(readStream, path + config.dateString + fileToSend);
        }).then(res => {
            logit("Sent to SFTP", path + config.dateString + fileToSend);
            sftp.end();
            resolve(0);
        }).catch(err => {
        logit("err3");
        logit(err);
        sftp.end();
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
process.on('uncaughtException', (err)=>{
    logit(err);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////
function logit(msg){
    console.log(msg);
    logFile.write(msg + '\n');
}
///////////////////////////////////////////////////////////////////////////////////////////////////////

