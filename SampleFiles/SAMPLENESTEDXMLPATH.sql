-- SAMPLE USING NESTED XML PATH
select  
x,
xx,
(
    select 
    'y' as y,
    'yy' as yy
    for xml path('LineItem'), type
)
from (
	select 
	'x' as x,
    'xx' as xx
) inr
FOR XML PATH ('Order'), root ('Root')