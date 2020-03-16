SET NOCOUNT ON;
SELECT (
	SELECT
		CONVERT(XML,
		'<ImportDirective>PERSON01</ImportDirective> 
			<Methods>
				<ImportKey>PayrollID</ImportKey>
				<AssertBlankInfo VarType="11">False</AssertBlankInfo>
				<InsertPerson VarType="11">True</InsertPerson>
				<UpdatePerson VarType="11">True</UpdatePerson>
			</Methods>
		') AS Header,
		CONVERT(XML,(	
			select 'Insert' AS [@Action], PayrollID, CASE WHEN PersonStatus = 'Y' THEN 'N' ELSE 'Y' END AS Retired, 
			[From], [To] AS Through, FirstName, MI, LastName, Contact1, Contact2, 
			rtrim(Contact3) Contact3, rtrim(Contact4) Contact4, BaseAuthority, Institution
			from avl.telestaff_person01 for xml path('Row')
	)) AS Rows
	FOR XML PATH('Data'), TYPE 
) as XMLData