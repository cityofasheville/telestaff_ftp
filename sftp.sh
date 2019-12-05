#!/usr/bin/bash
# fme csvTOupdateMunis.fmw

set -a
source .env
set +a

echo $ftp_url
echo $ftp_pw
echo $ftp_user

filename=Staffing01.xml 

echo 'cd WIM_IN/' > psftp.scr
echo 'put' $filename >> psftp.scr
echo 'close' >> psftp.scr

# "C:\Program Files\PuTTY\psftp.exe" -P 22 -l $ftp_user -pw $ftp_pw $ftp_url -b ".\psftp.scr" >> sftp.log
# Unix: sftp $ftp_user@$ftp_url
