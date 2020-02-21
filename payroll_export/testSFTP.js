'use strict';
// Testing sftp for one file
const fs = require('fs');
const Client = require('ssh2-sftp-client');
const sftp = new Client();

require('dotenv').config({path:'./.env'})

const config = {
    host: process.env.ftp_host,
    username: process.env.ftp_user,
    password: process.env.ftp_pw,
};

let remotePath = '/DEV/export/payroll/payroll-export--T20200219-I000-S1582131600505.csv';
let dst = fs.createWriteStream('/Users/jon/Documents/Telestaff/payroll_export/copy.csv');

// get file
const get = () => {
    sftp.connect(config).then(() => {
        return sftp.get(remotePath, dst);
    }).then((chunk) => {
        console.log(chunk);
        sftp.end();
    }).catch((err) => {
        console.log('catch err:', err)
    })
};

get()
