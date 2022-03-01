
const { InvokeCommand, LambdaClient } = require("@aws-sdk/client-lambda");
const client = new LambdaClient({ region: "us-east-1" });

// Set the parmaeters.
const params={
  // The name of the AWS Lambda function.
  FunctionName: "arn:aws:lambda:us-east-1:518970837364:function:ftp-jobs-py",
  InvocationType: "RequestResponse",
  LogType: "None",
  Payload: `{
    "action": "list",
    "ftp_connection": "telestaff_ftp",
    "ftp_path": "/PROD/export/"
  }`
}

// Call the Lambda function.
exports.handler = async function(event, context) {
  try {
    const data = await client.send(new InvokeCommand(params));
    console.log("data", Buffer.from(data.Payload).toString())
  } catch (err) {
    console.log("Error", err);
  }
};
