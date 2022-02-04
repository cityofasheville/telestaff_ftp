// example of using the ssh2 lib directly instead of ssh2-sftp-client
// https://github.com/mscdex/ssh2/blob/master/SFTP.md
const { Client } = require('ssh2');
require('dotenv').config({path:'./.env'})

function callback(ret){
  console.log("ret: ",ret)
  conn.end();
}

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    // sftp.readdir(process.env.ftp_export_path, (err, list) => {
    //   if (err) throw err;
    //   console.dir(list);
    // });
    sftp.fastPut("./tmp/Person.xml", "/PROD/person.errors/Person.xml",{},callback) // , "< object >options", "< function >callback")
  });
}).connect({
  port: 22,
  host: process.env.ftp_host,
  username: process.env.ftp_user,
  password: process.env.ftp_pw,
  readyTimeout: 90000
});


