WITH RscMaster AS (
SELECT 
	'Scott' RscMasterFNameCh,
    'P' RscMasterMNameCh,
    'Doe' RscMasterLNameCh,
    '01/01/2001' RscMasterFromDa,
    '01/01/9999' RscMasterThruDa,
    '(714)555-1212' RscMasterContact1Ch,
    '(800)555-1212' RscMasterContact2Ch,
    '(909)555-1212' RscMasterContact3Ch,
    '(111)555-1212' RscMasterContact4Ch,
    '124 Main St.' RscMasterAddress1Vc, 
    'Appt G2' RscMasterAddress2Vc,
    'Irvine' RscMasterCityVc,
    'CA' RscMasterStateCh,
    '92606' RscMasterZipCh,
    'N' RscMasterSpouseCh,
    'laaa' RscMasterEmployeeIDCh,
    'laaa' RscMasterPayrollIDCh,
    'PayrollID' RscMasterExternalIDCh,
    'laaa' RscMasterLoginNameCh,
    'A-37488' RscMasterBadgeIDCh,
    'M' RscMasterRaceTi,
    'M' RscMasterSexTi,
    '01/01/1970' RscMasterBirthdateDa, 
    'N' RscMasterDisableSi,
    '1' InstitutionAbrvCh,
    null SetupFiltersIn,
    8 AuthNoIn
    ),
Resources AS (
SELECT
    'PayrollID' RscMasterExternalIDCh,
    '10-000533-2' RscExternalIDCh
UNION
SELECT
    'PayrollID' RscMasterExternalIDCh,
    '10-another' RscExternalIDCh
)   
SELECT (
  SELECT CONVERT(XML,
		'<ImportDirective>PERSON02</ImportDirective>
	        <Methods>
	            <RemovableGroupAbrvChs VarType="88"></RemovableGroupAbrvChs>
	            <RemovableCanActAsAbrvChs VarType="88"></RemovableCanActAsAbrvChs>
	            <RemovableSpecAbrvChs VarType="88"></RemovableSpecAbrvChs>
	            <ImportKey>RscMasterExternalIDCh</ImportKey>
	            <AllOrNone>False</AllOrNone>
	        </Methods>
		') AS Header,
    CONVERT(XML,(
	    SELECT 'Insert' AS [@Action], *,
        (
            SELECT RscExternalIDCh   
            FROM  Resources  
            WHERE Resources.RscMasterExternalIDCh = RscMaster.RscMasterExternalIDCh  
            FOR XML PATH('Resource'), TYPE
        ) Resources
        from RscMaster
	    for xml path('Row')
    )) AS Rows
	FOR XML PATH('Data'), TYPE 
) as XMLData