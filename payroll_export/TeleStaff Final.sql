USE muntest

INSERT INTO muntest.dbo.prtmatdt (
prtd_run , prtd_warrant , prtd_batch , 

prtd_emp , prtd_from , prtd_to , 
prtd_absence , prtd_ssn , prtd_jclass , prtd_pay , prtd_quantity , 
prtd_uom , prtd_loc , prtd_reason , prtd_notes , prtd_org , prtd_obj , prtd_proj , 

prtd_wo , prtd_wo_task , prtd_s_emp , prtd_s_ssn , prtd_s_jclass , 
prtd_s_pay , prtd_s_quantity , prtd_s_uom , prtd_s_org , prtd_s_obj , prtd_s_proj , 
prtd_alloc , prtd_s_alloc , prtd_error , prtd_filler , prtd_orig_start , prtd_dept , prtd_activity , prtd_pay_rate , prtd_s_pay_rate , 
prtd_orig_batch , prtd_clerk , prtd_beg_time1 , prtd_end_time1 , prtd_beg_time2 , prtd_end_time2 , prtd_s_beg_time1 , prtd_s_end_time1 , 
prtd_s_beg_time2 , prtd_s_end_time2 , prtd_reference , prtd_position , prtd_s_partday , prtd_abs_partday , prtd_abs_emp , prtd_abs_jclass , 
prtd_proj_seg1 , prtd_proj_seg2 , prtd_proj_seg3 , prtd_proj_seg4 , prtd_proj_alloc , prtd_s_proj_seg1 , prtd_s_proj_seg2 , prtd_s_proj_seg3 , prtd_s_proj_seg4 , 
prtd_s_proj_alloc , prtd_ess_status , prtd_ess_clerk , prtd_ess_date , prtd_eep_num , prtd_beg_punch , prtd_end_punch , prtd_orig_rate , prtd_s_orig_rate , 
prtd_period , prtd_flsa , prtd_source 
)(
SELECT 
'&' AS prtd_run, 'sched' AS prtd_warrant, 1 AS prtd_batch, 

tTS.employeePayrollID AS prtd_emp, tTS.payRangeFrom AS prtd_from, tTS.payRangeThrough AS prtd_to, 
tMunis.Absence AS prtd_absence, tMunis.SSN AS prtd_ssn, tMunis.JobClass AS prtd_jclass, tMunis.PayID AS prtd_pay, tTS.hours AS prtd_quantity, 
tMunis.UoM AS prtd_uom, tMunis.LocWorked AS prtd_loc, '' AS prtd_reason, '' AS prtd_notes, tMunis.Org AS prtd_org, tMunis.Obj AS prtd_obj, tMunis.Proj AS prtd_proj, 

'', 0, 0, '', '', 0, 0, '', '', '', '', 0, 0, 0, '', NULL, '', '', 0, 0, 0, 'telestaff', 0, 0, 0, 0, 0, 0, 0, 0, '', 
0, '', '', 0, '', '', '', '', '', 0, '', '', '', '', 0, 'Y', '', NULL, 0, NULL, NULL, 0, 0, 'C', 0, 0

FROM avl.TelestaffImport AS tTS
LEFT JOIN (
SELECT		Employees1.EmployeeNumber AS EmpID, 
			PayTypes.Code AS PayID, 
			IIF(PayTypes.Category='3','Y', 'N') AS Absence, -- CATEGORY 3 = ABSENCE?
			People1.SSN AS SSN, 
			JobClasses.Code AS JobClass, 
            EmployeeJobs.PayrollWorkLocationCode AS LocWorked, 
			ISNULL(PayTypes.UnitOfMeasure, '') AS UoM,
			ISNULL(GLAccount.OrganizationCode, '') AS Org, 
			ISNULL(GLAccount.ObjectCode, '') AS Obj, 
            ISNULL(GLAccount.ProjectCode, '') AS Proj

FROM         People AS People1 INNER JOIN
                         Employees AS Employees1 ON People1.Id = Employees1.PersonId INNER JOIN
                         EmployeeJobs ON Employees1.Id = EmployeeJobs.EmployeeId INNER JOIN
                         JobClasses ON EmployeeJobs.JobClassId = JobClasses.Id LEFT OUTER JOIN
                         EmployeePays AS EmployeePays ON EmployeeJobs.Id = EmployeePays.EmployeeJobId INNER JOIN
                         PayTypes ON EmployeePays.PayTypeId = PayTypes.Id LEFT OUTER JOIN
                         Account_OrgObjProjCodes AS GLAccount ON GLAccount.Id = EmployeePays.PayrollGLAccountId
WHERE    (People1.DataSet = 0)
	AND	(EmployeePays.PayStatus = 'A')
	) AS tMunis
	ON	tTS.employeePayrollID = tMunis.EmpID	AND
		tTS.payrollCode = tMunis.PayID	
)
