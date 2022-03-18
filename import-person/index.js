const sql = require('mssql')
const { Client } = require('ssh2');
const { S3Client, PutObjectCommand }  = require("@aws-sdk/client-s3")
const s3_client = new S3Client({ region: "us-east-1" });
const { Readable, pipeline } = require("stream")
const fs = require('fs');

// For local..
require('dotenv').config({path:'./.env'})

exports.handler = async event => {
    const dateString = (new Date()).toJSON().replace(/:/g,'-');
    const xmlFile = `${dateString}Person.xml`
    const config = {
        sqlFile: 'PersonXML.sql',
        xmlFile: xmlFile,
        dbConfig: {
            user: process.env.sql_user,
            password: process.env.sql_pw,
            database: process.env.sql_db,
            server: process.env.sql_host,
            pool: {
              max: 10,
              min: 0,
              idleTimeoutMillis: 30000
            },
            options: {
              encrypt: true, // for azure
              trustServerCertificate: true // change to true for local dev / self-signed certs
            }
          },
        s3Config: {
            Bucket: "bedrock-data-files",
            Key: "",
            Body: "",
            path: 'telestaff-import-person/'
        },
        ftpConfig: {
            host: process.env.ftp_host,
            username: process.env.ftp_user,
            password: process.env.ftp_pw,
            path: process.env.ftp_import_path
    }
    }
    console.log(config.sqlFile)
    await loadAFile(config);
}

// exports.handler({})
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Read data from DB
async function loadAFile(config){

        const { sqlFile, xmlFile } = config;
        let sqlString = fs.readFileSync(sqlFile, "utf8");

        let conn = await sql.connect(config.dbConfig)
        const result = await sql.query(sqlString)
        conn.close()
        const data = result.recordset[0].XMLData

        await sendToS3(config,data)
        await sendToFtp(config,data)
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
async function sendToS3(config,data) {
    try{
        const uploadParams = config.s3Config
        uploadParams.Body = data
        uploadParams.Key = uploadParams.path + config.xmlFile

        const command = new PutObjectCommand(uploadParams)
        const response = await s3_client.send(command)
        console.log("S3 response:", response.$metadata.httpStatusCode)
    }
    catch(err) {
        console.log("S3 Err: ", err)
    }
}

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
            readyTimeout: 90000
        });
    });
}
