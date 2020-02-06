## Telestaff FTP
Sends and receives files to Kronos Telestaff.

# Upload
Sql files create XML, which is FTPed up.
Two files, Person and Staffing are uploaded.

# Download
Payroll csv file is downloaded from Telestaff and loaded into Munis, using stored procedure.

# clear_server_files
We will need to delete the payroll (export) files from the FTP server occasionally.
Import files they will clear.