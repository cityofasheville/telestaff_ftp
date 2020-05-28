Local testing, connect to VPN for DB; 
FTP read should work from there, or without VPN. (Writing FTP from Avl network is the prob)

The only diff from payroll_export should be the Lambda and Env stuff and /tmp/




* Bedrock steps(server/auth, filename, temptablename, realtablename)
FTP file (hardcoded file name?)
read file and copy to temp table
clear real table
transform data to real table using sql

* Telestaff steps
list FTP files
FTP each file
    clear real table
    read file and transform data to real table
    run stored proc
Delete each file on FTP

If I can't fit into Bedrock, set up logging/error emails.

* Telestaff inside Bedrock (with params)
1 Node: list FTP files > list
2 FTP: get file < list 
3 SQL: clear table
4 Load: file to temptable < list
5 SQL: temptable to table < list
6 SQL: stored proc