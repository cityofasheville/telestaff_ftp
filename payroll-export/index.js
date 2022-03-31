const { S3Client, PutObjectCommand }  = require("@aws-sdk/client-s3")
const { InvokeCommand, LambdaClient } = require("@aws-sdk/client-lambda");
const s3_client = new S3Client({ region: "us-east-1" });
const lambda_client = new LambdaClient({ region: "us-east-1" });

const load_db = require('./load_db'); 

exports.handler = async event => {
// async function handler(event){    
    lambda_params = {
        FunctionName: 'arn:aws:lambda:us-east-1:518970837364:function:ftp-jobs-py', // This Lambda puts files on S3
        InvocationType: 'RequestResponse',
        LogType: 'None',
        GetAll_Payload: {
            "action": "getall",
            "s3_connection": "s3_data_files",
            "s3_path": "telestaff-payroll-export/", 
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/export/payroll/"
        },
    }

    await ftp_get(lambda_params);
}
// handler()

///////////////////////////////////////////////////////////////////////////////////////////////////////
async function ftp_get(lambda_params){
    file_downloaded_list = []
    try {
        lambda_params.Payload = JSON.stringify(lambda_params.GetAll_Payload)

        const command = new InvokeCommand(lambda_params)
        const data = await lambda_client.send(command);
        const ftp_result_str = Buffer.from(data.Payload).toString()
        let results_obj = JSON.parse(ftp_result_str)
        if (results_obj.statusCode === 200) {
            console.log("FTP response: 200")
        }else{
            throw(results_obj)
        }

        console.log("Get All and Delete FTP: ", results_obj)

        let filenameList = results_obj.body
        .filter( filenm => filenm !== "payroll-report-export.csv" )
        .filter( filenm => filenm !== "APD-daily-payroll-export.csv" );

        await load_db( filenameList )

    } catch (err) {
        console.log("FTP Error: ", err);
        throw("FTP Error: " + err);
    }
}
