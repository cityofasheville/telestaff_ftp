const sql = require('mssql')

const { S3Client, PutObjectCommand }  = require("@aws-sdk/client-s3")
const { InvokeCommand, LambdaClient } = require("@aws-sdk/client-lambda");
const s3_client = new S3Client({ region: "us-east-1" });
const lambda_client = new LambdaClient({ region: "us-east-1" });

const fs = require('fs');

// For local..
// require('dotenv').config({path:'./.env'})

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
        s3_params: {
            Bucket: "bedrock-data-files",
            Key: "",
            Body: "",
            path: 'telestaff-ftp-backup/'
        },
        lambda_params: {
            put: {
                FunctionName: 'arn:aws:lambda:us-east-1:518970837364:function:ftp-jobs-py', // the lambda to invoke
                InvocationType: 'RequestResponse',
                LogType: 'None',
                Payload: `{
                    "action": "put",
                    "s3_connection": "s3_data_files",
                    "s3_path": "telestaff-ftp-backup/", 
                    "ftp_connection": "telestaff_ftp",
                    "ftp_path": "/PROD/import/ongoing.unprocessed/",
                    "filename": "${xmlFile}"
                }`
            }
        }
    }
    await loadAFile(config);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Read data from DB, save to file
async function loadAFile(config){

        const { sqlFile, xmlFile } = config;
        let sqlString = fs.readFileSync(sqlFile, "utf8");

        await sql.connect(config.dbConfig)

        const result = await sql.query(sqlString)
        const strResult = result.recordset[0].XMLData

        await sendToS3(config,strResult)
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
async function sendToS3(config,strResult) {
    try{
        const uploadParams = config.s3_params
        uploadParams.Body = strResult
        uploadParams.Key = uploadParams.path + config.xmlFile

        const command = new PutObjectCommand(uploadParams)
        const response = await s3_client.send(command)
        console.log("S3 response:", response.$metadata.httpStatusCode)
        await ftp_Lambda_Step(config)
    }
    catch(err) {
        console.log("S3 Err: ", err)
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
async function ftp_Lambda_Step(config){
        params = config.lambda_params.put;
        try {
            const command = new InvokeCommand(params)
            const data = await lambda_client.send(command);
            const ftp_result_str = Buffer.from(data.Payload).toString()
            let results_obj = JSON.parse(ftp_result_str)
            if (results_obj.statusCode === 200) {
                console.log("FTP response: 200")
            }else{
                console.log("FTP error")
            }
        } catch (err) {
        console.log("FTP Error", err);
        }

        

}
