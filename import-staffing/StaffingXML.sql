SET NOCOUNT ON;
-- SELECT '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>' + (
SELECT (	
	SELECT
	CONVERT(XML, (
		SELECT 
		'STAFFING01' AS ImportDirective,
		'False' AS [Methods/CallLog],
		'True' AS [Methods/InsertNew],
		'True' AS [Methods/UpdateExisting],
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
	CONVERT(XML, (	
		SELECT 'Insert' AS "@Action", 'True' AS "@Optional", 
    	PayrollID, StartDate, '00:00:00' AS StartTime, Duration, WorkCode
		FROM avl.telestaff_staffing01 
		WHERE WorkCode IN ('VE','HE','SE') 
		FOR XML PATH('Row')
	)) AS Rows
	FOR XML PATH('Data')
) AS XMLData