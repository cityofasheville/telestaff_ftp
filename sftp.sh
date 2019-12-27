#!/usr/bin/bash
# fme telestaffMunisToCSV.fmw

set -a
source .env
set +a

echo $ftp_url
echo $ftp_pw
echo $ftp_user

filename=avl.telestaff_staffing01.csv 

echo 'cd import/staffing.in/' > psftp.scr
echo 'put' $filename >> psftp.scr
echo 'close' >> psftp.scr

filename=avl.telestaff_person01.csv 

echo 'cd import/person.in/' > psftp.scr
echo 'put' $filename >> psftp.scr
echo 'close' >> psftp.scr
# "C:\Program Files\PuTTY\psftp.exe" -P 22 -l $ftp_user -pw $ftp_pw $ftp_url -b ".\psftp.scr" >> sftp.log
# Unix: sftp $ftp_user@$ftp_url
