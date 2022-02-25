const { Connection, Request } = require('tedious');

const { S3Client } = require('@aws-sdk/client-s3')
const { PutObjectCommand }  = require("@aws-sdk/client-s3")

const fs = require('fs');
const AWS = require('aws-sdk');

AWS.config.region = 'us-east-1';
const lambda = new AWS.Lambda();

// For local..
// require('dotenv').config({path:'./.env'})

exports.handler = async event => {
    const dateString = (new Date()).toJSON().replace(/:/g,'-');
    const config = {
        sqlFile: 'PersonXML.sql',
        xmlFile: `${dateString}Person.xml`,
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
        s3_params: {
            Bucket: "telestaff-ftp-backup",
            Key: "",
            Body: ""
        },
        ftp_params: {
            put: {
                FunctionName: 'arn:aws:lambda:us-east-1:518970837364:function:ftp-jobs-py', // the lambda to invoke
                InvocationType: 'RequestResponse',
                LogType: 'Tail',
                Payload: `{
                    "action": "list",
                    "ftp_connection": "telestaff_ftp",
                    "ftp_path": "/PROD/export/"
                }`
            }
        }
    }
    loadAFile(config);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Read data from DB, save to file
function loadAFile(config){
    return new Promise(function(resolve, reject) {
        const { sqlFile, xmlFile } = config;
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
                    fs.writeFileSync('/tmp/' + xmlFile, columns[0].value);
                });
                request.on('requestCompleted', function (rowCount, more, rows) { 
                    resolve(sendToS3(config));;
                });
                connection.execSql(request);
            }
        });
    });
}

function sendToS3(config) {
    const fileStream = fs.createReadStream('/tmp/' + config.xmlFile);
    const uploadParams = config.s3_params
    uploadParams.Body = fileStream
    uploadParams.Key = 'import-person/' + config.xmlFile
    s3Client.send(new PutObjectCommand(uploadParams))
    .then((data)=>{
        console.log(data)
    })
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
function FtpStep(fileToSend){
    return new Promise(function(resolve, reject) {

        console.log("Sending to SFTP: " + fileToSend); 

        // const { host, username, password, path, readyTimeout} = config.ftpConfig;
        
        // let readStream = fs.createReadStream('/tmp/'+fileToSend);
        // let sftp = new FTPClient();
        // sftp.on('close', (sftpError) => {
        //     if(sftpError){
        //         console.error(new Error("sftpError"));
        //     }
        // });
        // sftp.on('error', (err) => {
        //     console.error("err2" + err.level + err.description?err.description:'');
        //     console.error(new Error(err, fileToSend));
        // });

        // sftp.connect({
        //     host,
        //     username,
        //     password,
        //     debug: (msg)=>{
        //         console.log(msg)
        //     },
        //     readyTimeout
        // }).then(() => {
        //     console.log("FTP Connected");
        //     return sftp.put(readStream, path + config.dateString + fileToSend);
        // }).then(res => {
        //     console.log("Sent: " + res);
        //     sftp.end();
        //     resolve(0);
        // }).catch(err => {
        // console.error("err3");
        // console.error(err);
        // sftp.end();
        // });
    });
}
