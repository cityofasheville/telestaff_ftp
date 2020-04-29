# Telestaff FTP
Sends and receives files to Kronos Telestaff.

## import-person and import-staffing
Sql files create XML, which is FTPed up.
Two files, Person and Staffing (accruals) are uploaded.

## payroll_export/payroll_export.js
Payroll csv file is downloaded from Telestaff and loaded into Munis, using stored procedure.

## clear_server_files/clear_server_files.js
We will need to delete the payroll (export) files from the FTP server occasionally.
Import files they will clear. (this is redundant at this point payroll export deletes its own files)

## Project status
Master branch is deployed: two imports deployed to lambda, export doesn't work there so is deployed to coa-gis-fme2
Branches 'callback' and 'newhope' don't work yet, but are attempts at a rewrite using mssql instead of tedious (which allows db pool).

## TODO
- Yet another xml format *eyeroll*

## Timing 
Biweekly jobs are triggered weekly and use the payrollweek function becausqe cron can't do that.

We send Person1 and then Person2 nightly. Lambda: telestaff_import_person (4AM-EST) 
We pull Payroll Sun night payroll week. Coa-gis-fme2: c:\telestaff_ftp
We send Staffing (accruals) Wed night non-payroll weeks. Lambda: telestaff_import_staffing (Thursday-330AM-EST) .
