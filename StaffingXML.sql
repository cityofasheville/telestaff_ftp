SELECT
CONVERT(XML, (
	SELECT 
	'STAFFING01' AS ImportDirective,
	8 AS [Methods/ImportKey/@VarType],
	'PayrollID' AS [Methods/ImportKey],
	11 AS [Methods/AllOrNone/@VarType],
	'True' AS [Methods/AllOrNone],
	11 AS [Methods/TargetActive/@VarType],
	'True' AS [Methods/TargetActive],
	CONVERT(XML, (
		select  
		CONVERT(XML,(
			SELECT *
			FROM ( 
				SELECT CONVERT(VARCHAR(10),GETDATE(),23) AS Date , 'VE' AS Code
				UNION SELECT CONVERT(VARCHAR(10),GETDATE(),23), 'SE'
				UNION SELECT CONVERT(VARCHAR(10),GETDATE(),23), 'HE'
			) AS inr
			FOR XML PATH('SinceDate'), type
		)) 
		FOR XML PATH('SinceDateList')
	))
	FOR XML PATH('Header')
)),
	CONVERT(XML,(	SELECT PayrollID,StartDate,'00:00:00' AS StartTime,Duration,WorkCode
	from avl.telestaff_staffing01 WHERE WorkCode IN ('VE','HE','SE') FOR XML PATH('Row')
)) AS Rows
FOR XML PATH('Data')