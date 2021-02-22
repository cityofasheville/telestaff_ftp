# Telestaff FTP
Sends and receives files to Kronos Telestaff.
Import-person and payroll-export are deployed as AWS Lambdas.

## import-person 
SQL file creates XML, which is FTPed up.
Nightly runs as Lambda

## payroll_export
Payroll csv file is downloaded from Telestaff and loaded into Munis, using stored procedure.
Copy of file is stored in S3.

## Timing 
We send Person1 nightly. Lambda: telestaff_import_person 
Rule: Midnight EST (1am EDT) 05:00 UTC nightly cron(0 05 ? * * *)

We poll for new Payroll every 15 minutes; runs whenever they post to FTP. Lambda: telestaff_export_payroll 
Rule: Every 15 minutes 1400 to 2300 (9 or 10 AM to 6 or 7 PM) cron(0/15 14-23 ? * * *)

### Payrollweek.js
You can run a Lambda on a weekly cron but for biweekly jobs use this. Requires hard-coded date that is a known start of a payweek.
This code can be used to run code on: payroll week/not payroll week/both. 
Set env variable 'payrollweek' to pay/not/both

## _other
This folder holds several other modules not in use, so maybe not working. Notably:
### import-staffing (Accruals)
Sql file creates XML, which is FTPed up.
Runs biweekly as Lambda