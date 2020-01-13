select  CONVERT(XML,
'<ImportDirective>STAFFING01</ImportDirective> 
<Methods>
<AllorNone VarType="11">False</AllorNone>
<UpdateToMatchAssignment>True</UpdateToMatchAssignment>
</Methods> ') AS Header,
CONVERT(XML,(	SELECT PayrollID,StartDate,'00:00:00' AS StartTime,Duration,WorkCode
from avl.telestaff_staffing01 for xml path('Row')
)) AS Rows
for xml path('Data')

select  
CONVERT(XML,
'<ImportDirective>STAFFING01</ImportDirective>' ),
CONVERT(XML,
'<Methods>
	<ImportKey VarType="8">PayrollID</ImportKey>
	<AllOrNone VarType="11">True</AllOrNone>
	<TargetActive VarType="11">True</TargetActive>
  </Methods>'),
  (
    (
    select 
    convert(varchar(10),getdate(),23) as Date,
    'VE' as Code
    for xml path('SinceDate'), type
    ),
	(
    select 
    convert(varchar(10),getdate(),23) as Date,
    'SE' as Code
    for xml path('SinceDate'), type
    ),
	(
    select 
    convert(varchar(10),getdate(),23) as Date,
    'HE' as Code
    for xml path('SinceDate'), type
    )
  FOR XML PATH ('SinceDateList') 
  )
for xml path('Header')

<Data>
  <Header>
    <ImportDirective>STAFFING01</ImportDirective>
    <Methods>
      <AllorNone VarType="11">False</AllorNone>
      <UpdateToMatchAssignment>True</UpdateToMatchAssignment>
    </Methods>
  </Header>
  <Rows>
    <Row>
      <PayrollID>1044</PayrollID>
      <StartDate>2020-01-10</StartDate>
      <StartTime>00:00:00</StartTime>
      <Duration>321.9988</Duration>
      <WorkCode>VE</WorkCode>
    </Row>
  </Rows>
</Data>

/*
select  CONVERT(XML,
'<ImportDirective>STAFFING01</ImportDirective> 
<Methods>
<AllorNone VarType="11">False</AllorNone>
<UpdateToMatchAssignment>True</UpdateToMatchAssignment>
</Methods> ') AS Header,
CONVERT(XML,(	SELECT PayrollID,StartDate,'00:00:00' AS StartTime,Duration,WorkCode
from avl.telestaff_staffing01 for xml path('Row')
)) AS Rows
-- for xml path('Data')
*/


select -- comp
CONVERT(XML,
'<ImportDirective>STAFFING01</ImportDirective> 
<Methods>
<AllorNone VarType="11">False</AllorNone>
<UpdateToMatchAssignment>True</UpdateToMatchAssignment>
</Methods> '),
select
    (
    select 
    convert(varchar(10),getdate(),23) as Date,
    'VE' as Code
    for xml path('SinceDate'), type
    ),
	(
    select 
    convert(varchar(10),getdate(),23) as Date,
    'SE' as Code
    for xml path('SinceDate'), type
    ),
	(
    select 
    convert(varchar(10),getdate(),23) as Date,
    'HE' as Code
    for xml path('SinceDate'), type
    )
FOR XML PATH ('SinceDateList'), root ('Header')

<Root>
  <SinceDateList>
    <SinceDate>
      <Date>2020-01-10</Date>
      <Code>VE</Code>
    </SinceDate>
    <SinceDate>
      <Date>2020-01-10</Date>
      <Code>SE</Code>
    </SinceDate>
    <SinceDate>
      <Date>2020-01-10</Date>
      <Code>HE</Code>
    </SinceDate>
  </SinceDateList>
</Root>