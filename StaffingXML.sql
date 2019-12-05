
-- select PayrollID,WorkCode,Duration,StartDate from avl.telestaff_staffing01 for xml path('Row'), root('Rows')

-- select * from avl.telestaff_person01

select  CONVERT(XML,
'<ImportDirective>STAFFING01</ImportDirective> 
<Methods>
<AllorNone VarType="11">False</AllorNone>
<UpdateToMatchAssignment>True</UpdateToMatchAssignment>
</Methods> ') AS Header,
CONVERT(XML,(	SELECT PayrollID AS StaffingNoIn,StartDate,Duration,WorkCode
from avl.telestaff_staffing01 for xml path('Row')
)) AS Rows
for xml path('Data')