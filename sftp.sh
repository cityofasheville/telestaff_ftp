#!/usr/bin/env bash

# Get env vars
set -a
source .env
set +a

#Pull XML from DB
sqlcmd -S $sql_host -d $sql_db -y 0 -i StaffingXML.sql -o Staffing.xml
sqlcmd -S $sql_host -d $sql_db -y 0 -i PersonXML.sql -o Person.xml

echo $ftp_url
echo $ftp_pw
echo $ftp_user

date=$(date +%Y%m%d)
echo $date
#########################
staffingfilename=Staffing$date.xml 
echo $staffingfilename
mv Staffing.xml $staffingfilename 

personfilename=Person$date.xml 
echo $personfilename
mv Person.xml $personfilename 

# echo 'cd /DEV/WIM_OUT/' > psftp.scr
echo 'cd /DEV/import/ongoing.unprocessed/' > psftp.scr
echo 'put' $staffingfilename >> psftp.scr
echo 'put' $personfilename >> psftp.scr
echo 'close' >> psftp.scr

"C:\Program Files\PuTTY\psftp.exe" -P 22 -l $ftp_user -pw $ftp_pw $ftp_url -b ".\psftp.scr" >> sftp.log
# echo sftp $ftp_user@$ftp_url -b psftp.scr >> ftpcmd

mv $staffingfilename Staffing.xml 
mv $personfilename Person.xml 