

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
var lambda = new AWS.Lambda();

// exports.handler = function(event, context) {
  var params = {
    FunctionName: 'arn:aws:lambda:us-east-1:518970837364:function:ftp-jobs-py', // the lambda to invoke
    InvocationType: 'RequestResponse',
    LogType: 'Tail',
    Payload: `{
        "action": "list",
        "ftp_connection": "telestaff_ftp",
        "ftp_path": "/PROD/export/"
      }`
  };

  lambda.invoke(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log('Lambda_B said '+ data.Payload);
    }
    // if (err) {
    //   context.fail(err);
    // } else {
    //   context.succeed('Lambda_B said '+ data.Payload);
    // }
  })
// };