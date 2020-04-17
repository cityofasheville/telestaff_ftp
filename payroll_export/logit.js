var fs = require('fs');

let logFile = fs.createWriteStream('logfile.log');

function logit(msg){
    console.log(msg);
    logFile.write(msg + '\n');
}
module.exports = logit;