# Telestaff FTP
Sends and receives files to Kronos Telestaff.

## imports.js
Sql files create XML, which is FTPed up.
Two files, Person and Staffing are uploaded.

## payroll_export/payroll_export.js
Payroll csv file is downloaded from Telestaff and loaded into Munis, using stored procedure.

## clear_server_files/clear_server_files.js
We will need to delete the payroll (export) files from the FTP server occasionally.
Import files they will clear.