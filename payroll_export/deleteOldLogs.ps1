# Delete logfiles older than 30 day(s)
$Path = "C:\telestaff_ftp\payroll_export\tmp"
$Daysback = "-90"

$CurrentDate = Get-Date
$DatetoDelete = $CurrentDate.AddDays($Daysback)
Get-ChildItem $Path | Where-Object { $_.LastWriteTime -lt $DatetoDelete } | Remove-Item #-WhatIf
# Uncomment -WhatIf to see what files would be deleted