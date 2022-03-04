const { S3Client, PutObjectCommand }  = require("@aws-sdk/client-s3")
const { InvokeCommand, LambdaClient } = require("@aws-sdk/client-lambda");
const s3_client = new S3Client({ region: "us-east-1" });
const lambda_client = new LambdaClient({ region: "us-east-1" });

const load_db = require('./load_db'); 

// exports.handler = async event => {
async function handler(event){    
    lambda_params = {
        FunctionName: 'arn:aws:lambda:us-east-1:518970837364:function:ftp-jobs-py', // This Lambda puts files on S3
        InvocationType: 'RequestResponse',
        LogType: 'None',
        List_Payload: {
            "action": "list",
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/export/payroll/"
        },
        Get_Payload: {
            "action": "get",
            "s3_connection": "s3_data_files",
            "s3_path": "telestaff-payroll-export/", 
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/export/payroll/",
            "filename": ""
        },
        Del_Payload: {
            "action": "del",
            "ftp_connection": "telestaff_ftp",
            "ftp_path": "/PROD/export/payroll/",
            "filename": ""
        }
    }

    await ftp_get(lambda_params);
}
handler()

///////////////////////////////////////////////////////////////////////////////////////////////////////
async function ftp_get(lambda_params){
    file_downloaded_list = []
    try {
        // List all new files
        lambda_params.Payload = JSON.stringify(lambda_params.List_Payload)

        let results_obj = await send_to_lambda(lambda_params)
        console.log(results_obj)

        let filenameList = results_obj.body
        .filter( filenm => filenm !== "payroll-report-export.csv" )
        .filter( filenm => filenm !== "APD-daily-payroll-export.csv" );

        // Download each file from FTP: using reduce to call async func sequentially
        const call_download_a_file = async (previous, filenm) => {
            await previous;
            file_downloaded_list.push(filenm)
            return download_a_file(lambda_params,filenm);
        };
        await filenameList.reduce(call_download_a_file, Promise.resolve())

        // Load each file into Db
        load_db( file_downloaded_list )
        .then(async files_to_del => {
            // Delete each file from FTP: using reduce to call async func sequentially
            const call_del_ftp_file = async (previous, filenm) => {
                await previous;
                files_to_del.push(filenm)
                return del_ftp_file(lambda_params,filenm);
            };
            await filenameList.reduce(call_del_ftp_file, Promise.resolve())
        })
    } catch (err) {
        console.log("FTP Error", err);
    }
}

async function del_ftp_file(lambda_params,filenm) {
    try {
        console.log("Deleting from FTP: " + filenm); 
        lambda_params.Del_Payload.filename = filenm
        lambda_params.Payload = JSON.stringify(lambda_params.Del_Payload)
        let results_obj = await send_to_lambda(lambda_params)
        console.log("del_results_obj",results_obj)
        return filenm
    } catch (err) {
        console.log("FTP Delete Error", err);
        throw(err);
    }
}

async function download_a_file(lambda_params,filenm) {
    try {
        console.log("Reading from FTP: " + filenm); 
        lambda_params.Get_Payload.filename = filenm
        lambda_params.Payload = JSON.stringify(lambda_params.Get_Payload)
        let results_obj = await send_to_lambda(lambda_params)
        console.log("get_results_obj",results_obj)
        return filenm
    } catch (err) {
        console.log("FTP Download Error", err);
        throw(err);
    }
}

async function send_to_lambda(lambda_params) {
    const command = new InvokeCommand(lambda_params)
    const data = await lambda_client.send(command);
    const ftp_result_str = Buffer.from(data.Payload).toString()
    let results_obj = JSON.parse(ftp_result_str)
    if (results_obj.statusCode = 200) {
        return results_obj
    }else{
        throw results_obj
    }
    
}
