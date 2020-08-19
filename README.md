# Telestaff FTP
Sends and receives files to Kronos Telestaff.

## import-person 
SQL file creates XML, which is FTPed up.
Nightly runs as Lambda

## import-staffing (Accruals)
Sql file creates XML, which is FTPed up.
Runs biweekly as Lambda

## payroll_export/payroll_export.js
Payroll csv file is downloaded from Telestaff and loaded into Munis, using stored procedure.
Copy of file is stored in S3.

## Project status
Production branch is deployed to 3 lambdas.
Branches 'callback' and 'newhope' don't work yet, but are attempts at a rewrite using mssql instead of tedious (which allows db pool).

## TODO
- Person 02: Another xml format. Needed for Police go-live.

## Timing 
Biweekly jobs are triggered weekly and use the payrollweek function because Lambda cron can't do that.

We send Person1 nightly. [1AM/2AM] Lambda: telestaff_import_person (Midnt-EST    0 05 ? * * *) 
We pull Payroll Sun night payroll week. [1AM-Mon] Lambda: telestaff_export_payroll 
We send Staffing (accruals) Wed night non-payroll weeks. [1AM-Thur] Lambda: telestaff_import_staffing 0 05 ? * 5 *(Thursday-330AM-EST) .
