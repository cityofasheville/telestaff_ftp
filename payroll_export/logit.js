var fs = require('fs');

let logFile = fs.createWriteStream('logfile.log');

function logit(...msg){  // rest
    console.log(...msg); // spread
    logFile.write(msg + '\n');
}
module.exports = logit;