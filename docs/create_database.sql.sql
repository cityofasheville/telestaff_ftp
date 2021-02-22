----------------------------------
-- telestaff_import_time (identical to telestaff_import_time_apd)
----------------------------------
CREATE TABLE [avl].[telestaff_import_time](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[source] [varchar](32) NULL,
	[group] [varchar](32) NULL,
	[emp_id] [int] NULL,
	[pay_code] [smallint] NULL,
	[date_worked] [date] NULL,
	[hours_worked] [decimal](19, 4) NULL,
	[note] [varchar](128) NULL,
	[date_time_from] [datetime] NULL,
	[date_time_to] [datetime] NULL,
	[hours_calc]  AS (CONVERT([decimal](19,4),CONVERT([decimal](19,2),datediff(minute,[date_time_from],[date_time_to]))/(60))) PERSISTED,
 CONSTRAINT [PK_telestaff_import_time] PRIMARY KEY CLUSTERED 
 (
	[ID] ASC
 )
)
----------------------------------
-- telestaff_staffing01
----------------------------------
CREATE VIEW [avl].[telestaff_staffing01]
AS
SELECT	prec_emp AS PayrollID
		,	(SELECT CASE prec_type
					WHEN	1 THEN	'VE' --'VAC'
					WHEN	2 THEN	'SE' --'SICK'
					WHEN	4 THEN	'COMP'
					WHEN	5 THEN	'COMP'
					WHEN	6 THEN	'COMP'
					WHEN	7 THEN	'HE' --'HOL'
					WHEN	8 THEN	'FMLA'
					WHEN	9 THEN	'MIL'
				END
			) AS WorkCode
			, prec_avail AS Duration
			, CAST(GETDATE() as date) AS StartDate
FROM	prempacc 
WHERE	prec_active = 'Y' AND prec_proj = 0 AND prec_avail <> 0
	AND	prec_emp IN (
		SELECT DISTINCT [prem_emp]
		FROM [prempmst]
		WHERE prem_proj = 0
			AND	[prem_act_stat] = 'A'
			AND	([prem_loc] LIKE '11%'	OR	[prem_loc] LIKE '12%')
	)
----------------------------------
-- telestaff_person01
----------------------------------
ALTER VIEW [avl].[telestaff_person01]
AS

SELECT	PayrollID, PersonStatus, [From], [To], FirstName, MI, LastName
		, CityCell AS Contact1, PersonCell AS Contact2, email1 AS Contact3, email2 AS Contact4
		, BaseAuthority, Institution
FROM (
	SELECT [prem_emp] AS PayrollID
      ,IIF ([prem_act_stat]='A', 'Y','N') AS PersonStatus
	  ,CAST([prem_hire] as date) AS [From]
	  ,CAST(ISNULL([prem_inact_date],'9999-12-31') as date) AS [To]

      ,RTRIM([prem_fname]) AS FirstName
      ,RTRIM([prem_minit]) AS MI
	  ,RTRIM(RTRIM([prem_lname]) +  ' ' + RTRIM(ISNULL([prem_suffix],''))) AS LastName
	  
      ,IIF([prem_loc] LIKE '11%','6','17')	AS BaseAuthority
      ,IIF([prem_loc] LIKE '11%','CAFD','PD')	AS Institution

      ,IIF([prem_text_opt_in] = 'Y' AND [prem_phone_type]='CELL', [prem_home_ph], '') AS PersonCell
	  ,prem_email AS email1
	  ,prem_alt_email AS email2

  FROM [prempmst]
    WHERE prem_proj = 0
	--AND	[prem_act_stat] = 'A'
	AND	([prem_loc] LIKE '11%'	OR	[prem_loc] LIKE '12%') ) AS t1

LEFT JOIN	(
SELECT        CAST(LEFT([EID], 4) AS int) emp_id, [phone_cell] CityCell
FROM            [avl].[AD_Info] ) AS tAD
ON		PayrollID = emp_id

WHERE	[To] >= (GETDATE() - 30)
----------------------------------
-- sptelestaff_insert_time
----------------------------------
ALTER PROCEDURE [avl].[sptelestaff_insert_time]
AS

-- No Transaction as I do not want to lock table on a payroll Monday

INSERT INTO prtmatdt (
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
)
(
SELECT --DISTINCT  tTS.emp_id, tTS.pay_code, tTS.date_time_from,
'&' AS prtd_run, 'sched' AS prtd_warrant, 1 AS prtd_batch, 
tTS.emp_id AS prtd_emp, 
tTS.date_worked AS prtd_from, 
tTS.date_worked AS prtd_to, 
tMunis.Absence AS prtd_absence, 
tMunis.SSN AS prtd_ssn, tMunis.JobClass AS prtd_jclass, tMunis.PayID AS prtd_pay, 
tTS.hours_worked AS prtd_quantity, 
tMunis.UoM AS prtd_uom, tMunis.LocWorked AS prtd_loc, '' AS prtd_reason, '' AS prtd_notes, tMunis.Org AS prtd_org, tMunis.Obj AS prtd_obj, tMunis.Proj AS prtd_proj, 
'', 0, 0, '', '', 0, 0, '', '', '', '', 0, 0, 0, '', NULL, '', '', 0, 0, 0, 'telestaff', 0, 0, 0, 0, 0, 0, 0, 0, '', 
0, '', '', 0, '', '', '', '', '', 0, '', '', '', '', 0, 'Y', '', NULL, 0, NULL, NULL, 0, 0, 'C', 0, 0
FROM avl.telestaff_import_time AS tTS
LEFT JOIN (
SELECT		EmpID, 
			PayID, 
			Absence, -- CATEGORY 3 = ABSENCE?
			SSN, 
			JobClass, 
            LocWorked, 
			UoM,
			Org, 
			Obj, 
            Proj
FROM        (
SELECT pr_job_pay.[a_employee_number] AS EmpID
      ,[e_ssn] AS SSN
      --,[a_activity_status]
      ,[a_location]
      ,pr_job_pay.[a_projection]
      ,[a_job_class_code] AS JobClass
      --,[a_primary_job_class]
      ,[a_pay_type] AS PayID
      ,[a_location] AS LocWorked
      ,[jb_job_calc_code]
      ,[a_position_code]
      ,[a_org] AS Org
      ,[a_object] AS Obj
      ,[s_d_proj] AS Proj
      ,[s_start_date]
      ,[s_end_date]
      ,[a_base_pay]
      ,[s_status]
      ,[s_emp_pay_type]
      ,[jb_status]
      ,[jb_pay_basis]
      ,[s_inactive]
      --,[e_supervisor]
	  ,PayTypes.Category 
	  ,ISNULL(PayTypes.UnitOfMeasure, '') AS UoM
	  ,IIF(PayTypes.Category='3','Y', 'N') AS Absence
  FROM (
    SELECT [JobPay].[a_projection],
       [JobPay].[a_employee_number],
       [JobPay].[a_job_class_code],
       [JobPay].[s_on_recur_scr_y_n],
       [JobPay].[a_pay_type],
       [JobPay].[s_line_sequence],
       [JobPay].[a_location],
       [JobPay].[a_bargain_unit],
       [JobPay].[jb_job_calc_code],
       [JobPay].[a_position_code],
       [JobPay].[g_grade],
       [JobPay].[gs_step_table],
       [JobPay].[gs_step_date],
       [JobPay].[gs_next_step_date],
       [JobPay].[s_earn_mult_fact],
       [JobPay].[s_days_per_year],
       [JobPay].[s_period_hours],
       [JobPay].[s_hours_per_day],
       [JobPay].[s_pay_periods],
       [JobPay].[s_frequency],
       [JobPay].[s_pay_scale],
       [JobPay].[s_work_sundays],
       [JobPay].[s_work_mondays],
       [JobPay].[s_work_tuesdays],
       [JobPay].[s_work_wednesdays],
       [JobPay].[s_work_thurdays],
       [JobPay].[s_work_fridays],
       [JobPay].[s_work_saturdays],
       [JobPay].[s_week_cyc1_y_n],
       [JobPay].[s_week_cyc2_y_n],
       [JobPay].[s_week_cyc3_y_n],
       [JobPay].[s_week_cyc4_y_n],
       [JobPay].[s_week_cyc5_y_n],
       [JobPay].[s_fulltime_percent],
       [JobPay].[a_salary_annual],
       [JobPay].[s_period_salary],
       [JobPay].[s_daily_rate],
       [JobPay].[s_hourly_rate],
       [JobPay].[s_compa_ratio],
       [JobPay].[s_earnings_limit],
       [JobPay].[r_risk],
       [JobPay].[a_org],
       [JobPay].[a_object],
       [JobPay].[s_d_proj],
       [JobPay].[s_start_date],
       [JobPay].[s_end_date],
       [JobPay].[a_allocation_code],
       [JobPay].[s_reference_salary],
       [JobPay].[s_ded_flag],
       [JobPay].[s_add_to_base_y_n],
       [JobPay].[a_base_pay],
       [JobPay].[s_salary_job_pay],
       [JobPay].[s_line_pay_amount],
       [JobPay].[s_daily_rate_jb],
       [JobPay].[s_hourly_rate_jp],
       [JobPay].[s_earning_limit_jp],
       [JobPay].[s_last_review_date],
       [JobPay].[s_next_review_date],
       [JobPay].[s_status],
       [JobPay].[g_next_grade],
       [JobPay].[s_next_step2],
       [JobPay].[s_next_period],
       [JobPay].[s_days_per_yr2],
       [JobPay].[s_period_nxt_hours],
       [JobPay].[s_salary_raise],
       [JobPay].[s_line_next_pay],
       [JobPay].[s_daily_rate_raise],
       [JobPay].[s_hourly_rt_raise],
       [JobPay].[s_earn_limit_raise],
       [JobPay].[s_contract_status],
       [JobPay].[s_emp_pay_type],
       [JobPay].[g_grade_level],
       [JobPay].[s_on_pay_scrn_y_n],
       [JobPay].[s_pay_months],
       [JobPay].[s_tenure_date],
       [JobPay].[s_contract_date],
       [JobPay].[s_hire_apprvl_date],
       [JobPay].[s_hire_apprvl_time],
       [JobPay].[s_benefit_status],
       [JobPay].[s_balloon_pay_y_n],
       [JobPay].[s_civil_serv],
       [JobPay].[s_prior_mths_exper],
       [JobPay].[s_prior_yrs_exper],
       [JobPay].[s_years_here],
       [JobPay].[s_hours_per_year],
       [JobPay].[s_days_per_period],
       [JobPay].[s_projected_salary],
       [JobPay].[s_remainsal_in_yr],
       [JobPay].[s_calendar_code],
       [JobPay].[s_work_sched_code],
       [JobPay].[s_frozen_o_f_m_n],
       [JobPay].[s_encumber_y_n],
       [JobPay].[s_remainpays_in_yr],
       [JobPay].[s_last_hrly_rt],
       [JobPay].[s_last_daily_rt],
       [JobPay].[s_last_per_sal],
       [JobPay].[s_last_step_date],
       [JobPay].[s_filler],
       [JobPay].[s_subj],
       [JobPay].[s_pending_pos],
       [JobPay].[s_civ_class],
       [JobPay].[s_civ_class_status],
       [JobPay].[s_civ_start_dt],
       [JobPay].[s_civ_prob_end_dt],
       [JobPay].[s_civ_expire_dt],
       [JobPay].[s_civ_retire_dt],
       [JobPay].[s_civ_designation],
       [JobPay].[s_civ_desig_status],
       [JobPay].[s_civ_comment],
       [JobPay].[s_civ_retire_num],
       [JobPay].[s_userdef1],
       [JobPay].[s_userdef2],
       [JobPay].[s_userdef3],
       [JobPay].[s_userdef4],
       [JobPay].[s_userdef5],
       [JobPay].[s_inactive],
       [JobPay].[s_flsa_ot],
       [JobPay].[a_job_class_descsh],
       [JobPay].[a_job_class_desc],
       [JobPay].[jb_summary_cat1],
       [JobPay].[jb_summary_cat2],
       [JobPay].[jb_status],
       [JobPay].[jb_bargain_unit],
       [JobPay].[jb_non_payroll_emp],
       [JobPay].[jb_eeo_part_full_t],
       [JobPay].[jb_eeo_class],
       [JobPay].[jb_eeo_function],
       [JobPay].[jb_risk_code],
       [JobPay].[jb_basepay_code],
       [JobPay].[jb_flsa_exmt_code],
       [JobPay].[jb_pos_control_y_n],
       [JobPay].[jb_grstep_tbl_y_n],
       [JobPay].[jb_min_grade],
       [JobPay].[jb_max_grade],
       [JobPay].[jb_min_step],
       [JobPay].[jb_max_step],
       [JobPay].[jb_pay_basis],
       [JobPay].[jb_min_pay],
       [JobPay].[jb_max_pay],
       [JobPay].[jb_annual_periods],
       [JobPay].[jb_sched_hours],
       [JobPay].[jb_gl_project],
       [JobPay].[jb_teacher_y_n],
       [JobPay].[jb_sub_teacher_y_n],
       [JobPay].[jb_calc_code],
       [JobPay].[jb_hrs_per_day],
       [JobPay].[jb_hrs_per_yr],
       [JobPay].[jb_days_per_yr],
       [JobPay].[jb_employee_type],
       [JobPay].[jb_sub_teach_code],
       [JobPay].[jb_longevity_type],
       [JobPay].[jb_day_per_month],
       [JobPay].[jb_incr_earn_days],
       [JobPay].[jb_filler],
       [JobPay].[jb_reference],
       [JobPay].[jb_gen_labor],
       [JobPay].[jb_calendar],
       [JobPay].[a_bargain_desc_sh],
       [JobPay].[a_bargain_desc],
       [JobPay].[a_location_desc_sh],
       [JobPay].[a_location_desc],
       [JobPay].[s_schedule],
       [JobPay].[s_team],
       [JobPay].[s_escrow],
       [JobPay].[s_last_dayhrs],
       [JobPay].[s_proj_seg1],
       [JobPay].[s_proj_seg2],
       [JobPay].[s_proj_seg3],
       [JobPay].[s_proj_seg4],
       [JobPay].[s_proj_allocation],
       [JobPay].[jb_days_worked],
       [JobPay].[jb_holding_project],
       [JobPay].[jb_holding_object],
       [JobPay].[jb_holding_org],
       [JobPay].[jb_market_rate],
       [JobPay].[jb_mid_rate],
       [JobPay].[a_role_key],
       [JobPay].[jb_segment1],
       [JobPay].[jb_segment2],
       [JobPay].[jb_segment3],
       [JobPay].[jb_segment4],
       [JobPay].[jb_segment5],
       [JobPay].[jb_segment6],
       [JobPay].[jb_segment7],
       [JobPay].[jb_segment8],
       [JobPay].[jb_service_id],
       [JobPay].[jb_state_position],
       [JobPay].[jb_user_defined1],
       [JobPay].[jb_user_defined2],
       [JobPay].[jb_schedule],
       [JobPay].[jb_team],
       [JobPay].[jb_proj_seg1],
       [JobPay].[jb_proj_seg2],
       [JobPay].[jb_proj_seg3],
       [JobPay].[jb_proj_seg4],
       [JobPay].[jb_hold_proj_seg1],
       [JobPay].[jb_hold_proj_seg2],
       [JobPay].[jb_hold_proj_seg3],
       [JobPay].[jb_hold_proj_seg4],
       [JobPay].[s_work_start_date],
       [JobPay].[s_work_end_date],
       [JobPay].[a_name_last],
       [JobPay].[s_middle_name],
       [JobPay].[a_name_first],
       [JobPay].[a_name_suffix],
       [JobPay].[e_dep_cd],
       [JobPay].[e_supervisor],
       [JobPay].[s_name_first],
       [JobPay].[s_name_middle],
       [JobPay].[s_name_last],
       [JobPay].[s_name_suffix],
       [JobPay].[primary_job]
  FROM [PayrollReportingServices].[JobPay]('munis')) AS pr_job_pay
  LEFT JOIN PayTypes	ON pr_job_pay.a_pay_type = PayTypes.Code
  LEFT JOIN pr_employee_master ON pr_job_pay.a_employee_number = pr_employee_master.a_employee_number  AND	pr_job_pay.a_projection = pr_employee_master.a_projection
    WHERE	primary_job = 'Y'
	AND pr_job_pay.a_projection = 0
	AND	s_inactive = 'A'
	) AS t1
	) AS tMunis
	ON	tTS.emp_id = tMunis.EmpID	AND
		tTS.pay_code = tMunis.PayID	


WHERE	tMunis.PayID	IS NOT NULL)

GO
----------------------------------
-- sptelestaff_insert_time_apd
-- Includes SHIFT DIFFERENTIAL
----------------------------------

ALTER PROCEDURE [avl].[sptelestaff_insert_time_apd]
AS
-- No Transaction as I do not want to lock table on a payroll Monday


--	INSERT APD TIME

INSERT INTO prtmatdt (
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
)
(
SELECT --DISTINCT  tTS.emp_id, tTS.pay_code, tTS.date_time_from,
'&' AS prtd_run, 'sched' AS prtd_warrant, 1 AS prtd_batch, 
tTS.emp_id AS prtd_emp, 
tTS.date_worked AS prtd_from, 
tTS.date_worked AS prtd_to, 
tMunis.Absence AS prtd_absence, 
tMunis.SSN AS prtd_ssn, tMunis.JobClass AS prtd_jclass, tMunis.PayID AS prtd_pay, 
tTS.hours_worked AS prtd_quantity, 
tMunis.UoM AS prtd_uom, tMunis.LocWorked AS prtd_loc, '' AS prtd_reason, '' AS prtd_notes, tMunis.Org AS prtd_org, tMunis.Obj AS prtd_obj, tMunis.Proj AS prtd_proj, 
'', 0, 0, '', '', 0, 0, '', '', '', '', 0, 0, 0, '', NULL, '', '', 0, 0, 0, 'telestaff', 0, 0, 0, 0, 0, 0, 0, 0, '', 
0, '', '', 0, '', '', '', '', '', 0, '', '', '', '', 0, 'Y', '', NULL, 0, NULL, NULL, 0, 0, 'C', 0, 0
FROM avl.telestaff_import_time_apd AS tTS
LEFT JOIN (
SELECT		EmpID, 
			PayID, 
			Absence, -- CATEGORY 3 = ABSENCE?
			SSN, 
			JobClass, 
            LocWorked, 
			UoM,
			Org, 
			Obj, 
            Proj
FROM        (
SELECT pr_job_pay.[a_employee_number] AS EmpID
      ,[e_ssn] AS SSN
      --,[a_activity_status]
      ,[a_location]
      ,pr_job_pay.[a_projection]
      ,[a_job_class_code] AS JobClass
      --,[a_primary_job_class]
      ,[a_pay_type] AS PayID
      ,[a_location] AS LocWorked
      ,[jb_job_calc_code]
      ,[a_position_code]
      ,[a_org] AS Org
      ,[a_object] AS Obj
      ,[s_d_proj] AS Proj
      ,[s_start_date]
      ,[s_end_date]
      ,[a_base_pay]
      ,[s_status]
      ,[s_emp_pay_type]
      ,[jb_status]
      ,[jb_pay_basis]
      ,[s_inactive]
      --,[e_supervisor]
	  ,PayTypes.Category 
	  ,ISNULL(PayTypes.UnitOfMeasure, '') AS UoM
	  ,IIF(PayTypes.Category='3','Y', 'N') AS Absence
  FROM (
  SELECT [JobPay].[a_projection],
       [JobPay].[a_employee_number],
       [JobPay].[a_job_class_code],
       [JobPay].[s_on_recur_scr_y_n],
       [JobPay].[a_pay_type],
       [JobPay].[s_line_sequence],
       [JobPay].[a_location],
       [JobPay].[a_bargain_unit],
       [JobPay].[jb_job_calc_code],
       [JobPay].[a_position_code],
       [JobPay].[g_grade],
       [JobPay].[gs_step_table],
       [JobPay].[gs_step_date],
       [JobPay].[gs_next_step_date],
       [JobPay].[s_earn_mult_fact],
       [JobPay].[s_days_per_year],
       [JobPay].[s_period_hours],
       [JobPay].[s_hours_per_day],
       [JobPay].[s_pay_periods],
       [JobPay].[s_frequency],
       [JobPay].[s_pay_scale],
       [JobPay].[s_work_sundays],
       [JobPay].[s_work_mondays],
       [JobPay].[s_work_tuesdays],
       [JobPay].[s_work_wednesdays],
       [JobPay].[s_work_thurdays],
       [JobPay].[s_work_fridays],
       [JobPay].[s_work_saturdays],
       [JobPay].[s_week_cyc1_y_n],
       [JobPay].[s_week_cyc2_y_n],
       [JobPay].[s_week_cyc3_y_n],
       [JobPay].[s_week_cyc4_y_n],
       [JobPay].[s_week_cyc5_y_n],
       [JobPay].[s_fulltime_percent],
       [JobPay].[a_salary_annual],
       [JobPay].[s_period_salary],
       [JobPay].[s_daily_rate],
       [JobPay].[s_hourly_rate],
       [JobPay].[s_compa_ratio],
       [JobPay].[s_earnings_limit],
       [JobPay].[r_risk],
       [JobPay].[a_org],
       [JobPay].[a_object],
       [JobPay].[s_d_proj],
       [JobPay].[s_start_date],
       [JobPay].[s_end_date],
       [JobPay].[a_allocation_code],
       [JobPay].[s_reference_salary],
       [JobPay].[s_ded_flag],
       [JobPay].[s_add_to_base_y_n],
       [JobPay].[a_base_pay],
       [JobPay].[s_salary_job_pay],
       [JobPay].[s_line_pay_amount],
       [JobPay].[s_daily_rate_jb],
       [JobPay].[s_hourly_rate_jp],
       [JobPay].[s_earning_limit_jp],
       [JobPay].[s_last_review_date],
       [JobPay].[s_next_review_date],
       [JobPay].[s_status],
       [JobPay].[g_next_grade],
       [JobPay].[s_next_step2],
       [JobPay].[s_next_period],
       [JobPay].[s_days_per_yr2],
       [JobPay].[s_period_nxt_hours],
       [JobPay].[s_salary_raise],
       [JobPay].[s_line_next_pay],
       [JobPay].[s_daily_rate_raise],
       [JobPay].[s_hourly_rt_raise],
       [JobPay].[s_earn_limit_raise],
       [JobPay].[s_contract_status],
       [JobPay].[s_emp_pay_type],
       [JobPay].[g_grade_level],
       [JobPay].[s_on_pay_scrn_y_n],
       [JobPay].[s_pay_months],
       [JobPay].[s_tenure_date],
       [JobPay].[s_contract_date],
       [JobPay].[s_hire_apprvl_date],
       [JobPay].[s_hire_apprvl_time],
       [JobPay].[s_benefit_status],
       [JobPay].[s_balloon_pay_y_n],
       [JobPay].[s_civil_serv],
       [JobPay].[s_prior_mths_exper],
       [JobPay].[s_prior_yrs_exper],
       [JobPay].[s_years_here],
       [JobPay].[s_hours_per_year],
       [JobPay].[s_days_per_period],
       [JobPay].[s_projected_salary],
       [JobPay].[s_remainsal_in_yr],
       [JobPay].[s_calendar_code],
       [JobPay].[s_work_sched_code],
       [JobPay].[s_frozen_o_f_m_n],
       [JobPay].[s_encumber_y_n],
       [JobPay].[s_remainpays_in_yr],
       [JobPay].[s_last_hrly_rt],
       [JobPay].[s_last_daily_rt],
       [JobPay].[s_last_per_sal],
       [JobPay].[s_last_step_date],
       [JobPay].[s_filler],
       [JobPay].[s_subj],
       [JobPay].[s_pending_pos],
       [JobPay].[s_civ_class],
       [JobPay].[s_civ_class_status],
       [JobPay].[s_civ_start_dt],
       [JobPay].[s_civ_prob_end_dt],
       [JobPay].[s_civ_expire_dt],
       [JobPay].[s_civ_retire_dt],
       [JobPay].[s_civ_designation],
       [JobPay].[s_civ_desig_status],
       [JobPay].[s_civ_comment],
       [JobPay].[s_civ_retire_num],
       [JobPay].[s_userdef1],
       [JobPay].[s_userdef2],
       [JobPay].[s_userdef3],
       [JobPay].[s_userdef4],
       [JobPay].[s_userdef5],
       [JobPay].[s_inactive],
       [JobPay].[s_flsa_ot],
       [JobPay].[a_job_class_descsh],
       [JobPay].[a_job_class_desc],
       [JobPay].[jb_summary_cat1],
       [JobPay].[jb_summary_cat2],
       [JobPay].[jb_status],
       [JobPay].[jb_bargain_unit],
       [JobPay].[jb_non_payroll_emp],
       [JobPay].[jb_eeo_part_full_t],
       [JobPay].[jb_eeo_class],
       [JobPay].[jb_eeo_function],
       [JobPay].[jb_risk_code],
       [JobPay].[jb_basepay_code],
       [JobPay].[jb_flsa_exmt_code],
       [JobPay].[jb_pos_control_y_n],
       [JobPay].[jb_grstep_tbl_y_n],
       [JobPay].[jb_min_grade],
       [JobPay].[jb_max_grade],
       [JobPay].[jb_min_step],
       [JobPay].[jb_max_step],
       [JobPay].[jb_pay_basis],
       [JobPay].[jb_min_pay],
       [JobPay].[jb_max_pay],
       [JobPay].[jb_annual_periods],
       [JobPay].[jb_sched_hours],
       [JobPay].[jb_gl_project],
       [JobPay].[jb_teacher_y_n],
       [JobPay].[jb_sub_teacher_y_n],
       [JobPay].[jb_calc_code],
       [JobPay].[jb_hrs_per_day],
       [JobPay].[jb_hrs_per_yr],
       [JobPay].[jb_days_per_yr],
       [JobPay].[jb_employee_type],
       [JobPay].[jb_sub_teach_code],
       [JobPay].[jb_longevity_type],
       [JobPay].[jb_day_per_month],
       [JobPay].[jb_incr_earn_days],
       [JobPay].[jb_filler],
       [JobPay].[jb_reference],
       [JobPay].[jb_gen_labor],
       [JobPay].[jb_calendar],
       [JobPay].[a_bargain_desc_sh],
       [JobPay].[a_bargain_desc],
       [JobPay].[a_location_desc_sh],
       [JobPay].[a_location_desc],
       [JobPay].[s_schedule],
       [JobPay].[s_team],
       [JobPay].[s_escrow],
       [JobPay].[s_last_dayhrs],
       [JobPay].[s_proj_seg1],
       [JobPay].[s_proj_seg2],
       [JobPay].[s_proj_seg3],
       [JobPay].[s_proj_seg4],
       [JobPay].[s_proj_allocation],
       [JobPay].[jb_days_worked],
       [JobPay].[jb_holding_project],
       [JobPay].[jb_holding_object],
       [JobPay].[jb_holding_org],
       [JobPay].[jb_market_rate],
       [JobPay].[jb_mid_rate],
       [JobPay].[a_role_key],
       [JobPay].[jb_segment1],
       [JobPay].[jb_segment2],
       [JobPay].[jb_segment3],
       [JobPay].[jb_segment4],
       [JobPay].[jb_segment5],
       [JobPay].[jb_segment6],
       [JobPay].[jb_segment7],
       [JobPay].[jb_segment8],
       [JobPay].[jb_service_id],
       [JobPay].[jb_state_position],
       [JobPay].[jb_user_defined1],
       [JobPay].[jb_user_defined2],
       [JobPay].[jb_schedule],
       [JobPay].[jb_team],
       [JobPay].[jb_proj_seg1],
       [JobPay].[jb_proj_seg2],
       [JobPay].[jb_proj_seg3],
       [JobPay].[jb_proj_seg4],
       [JobPay].[jb_hold_proj_seg1],
       [JobPay].[jb_hold_proj_seg2],
       [JobPay].[jb_hold_proj_seg3],
       [JobPay].[jb_hold_proj_seg4],
       [JobPay].[s_work_start_date],
       [JobPay].[s_work_end_date],
       [JobPay].[a_name_last],
       [JobPay].[s_middle_name],
       [JobPay].[a_name_first],
       [JobPay].[a_name_suffix],
       [JobPay].[e_dep_cd],
       [JobPay].[e_supervisor],
       [JobPay].[s_name_first],
       [JobPay].[s_name_middle],
       [JobPay].[s_name_last],
       [JobPay].[s_name_suffix],
       [JobPay].[primary_job]
  FROM [PayrollReportingServices].[JobPay]('munis')
      WHERE	primary_job = 'Y'
	AND a_projection = 0
	AND	s_inactive = 'A'
  ) AS pr_job_pay
  LEFT JOIN PayTypes	ON pr_job_pay.a_pay_type = PayTypes.Code
  LEFT JOIN pr_employee_master ON pr_job_pay.a_employee_number = pr_employee_master.a_employee_number  AND	pr_job_pay.a_projection = pr_employee_master.a_projection
    WHERE	primary_job = 'Y'
	AND pr_job_pay.a_projection = 0
	AND	s_inactive = 'A'
	) AS t1
	) AS tMunis
	ON	tTS.emp_id = tMunis.EmpID	AND
		tTS.pay_code = tMunis.PayID	


WHERE	tMunis.PayID	IS NOT NULL
--ORDER BY tTS.emp_id, tTS.pay_code, tTS.date_time_from
)

--	INSERT SHIFT DIFFERENTIAL

INSERT INTO prtmatdt (
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
)

SELECT 
'&' AS prtd_run, 'sched' AS prtd_warrant, 1 AS prtd_batch, 
prtd_emp, 
prtd_from, 
prtd_to, 
prtd_absence, NULL AS prtd_ssn, prtd_jclass, prtd_pay, 
prtd_quantity, 
prtd_uom, prtd_loc, prtd_reason, prtd_notes, prtd_org, prtd_obj, prtd_proj, 
'', 0, 0, '', '', 0, 0, '', '', '', '', 0, 0, 0, '', NULL, '', '', 0, 0, 0, 'telestaff', 0, 0, 0, 0, 0, 0, 0, 0, '', 
0, '', '', 0, '', '', '', '', '', 0, '', '', '', '', 0, 'Y', '', NULL, 0, NULL, NULL, 0, 0, 'C', 0, 0
FROM (
SELECT 
'&' AS prtd_run, 'sched' AS prtd_warrant, 1 AS prtd_batch, 
tTS.emp_id AS prtd_emp, 
tTS.date_worked AS prtd_from, 
tTS.date_worked AS prtd_to, 
tMunis.Absence AS prtd_absence, tMunis.SSN AS prtd_ssn, tMunis.JobClass AS prtd_jclass, tMunis.PayID AS prtd_pay, 
tTS.Shift_Differential AS prtd_quantity, 
tMunis.UoM AS prtd_uom, tMunis.LocWorked AS prtd_loc, '' AS prtd_reason, '' AS prtd_notes, tMunis.Org AS prtd_org, tMunis.Obj AS prtd_obj, tMunis.Proj AS prtd_proj
/*,'', 0, 0, '', '', 0, 0, '', '', '', '', 0, 0, 0, '', NULL, '', '', 0, 0, 0, 'telestaff', 0, 0, 0, 0, 0, 0, 0, 0, '', 
0, '', '', 0, '', '', '', '', '', 0, '', '', '', '', 0, 'Y', '', NULL, 0, NULL, NULL, 0, 0, 'C', 0, 0*/
FROM
(
SELECT * --DISTINCT pay_code
FROM(
SELECT [ID]
      ,[source]
      ,[group]
      ,[emp_id]
      ,'290' AS [pay_code]
      ,[date_worked]
      ,[hours_worked]
      ,[note]
      ,[date_time_from]
      ,[date_time_to]
      ,[hours_calc]
-- MSSQL CASE statement will exit after first true WHEN. So no need to add a milli-second to differentiate Out scenarios.
,CASE	-- NOTE: I think Munis cannot handle more than 24 hours
--.01 --
	WHEN ([date_time_from] BETWEEN CAST(CAST([date_time_from] as date) as datetime) AND DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime)) 
	 AND ([date_time_to]   BETWEEN CAST(CAST([date_time_from] as date) as datetime) AND DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from],[date_time_to]) as decimal(6,2))/60
--.02 --
	WHEN ([date_time_from] BETWEEN CAST(CAST([date_time_from] as date) as datetime) AND DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime)) 
	 AND ([date_time_to]   BETWEEN DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from], DATEADD(hour,7,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60
--.03 --
	WHEN ([date_time_from] BETWEEN CAST(CAST([date_time_from] as date) as datetime) AND DATEADD(hour,7,CAST(CAST([date_time_from] as date) as datetime)) 
	 AND ([date_time_to]   BETWEEN DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from], DATEADD(hour,7,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60
		  +  CAST(DATEDIFF(minute,DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)), [date_time_to]) as decimal(6,2))/60
--.04 --
	WHEN ([date_time_from] BETWEEN CAST(CAST([date_time_from] as date) as datetime) AND DATEADD(hour,7,CAST(CAST([date_time_from] as date) as datetime)) 
	 AND ([date_time_to]		>  DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from], DATEADD(hour,7,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60
		   + CAST(DATEDIFF(minute,DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)), DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60
--.05 --
	WHEN ([date_time_from] BETWEEN DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime))
	 AND ([date_time_to]   BETWEEN DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)), [date_time_to]) as decimal(6,2))/60	
--.06 --
	WHEN ([date_time_from] BETWEEN DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime))
	 AND ([date_time_to]   BETWEEN DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,42,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)), DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60	
--.07 --
	WHEN ([date_time_from] BETWEEN DATEADD(hour, 7,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime))
	 AND ([date_time_to]		>  DATEADD(hour,42,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)), DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60
		   + CAST(DATEDIFF(minute,DATEADD(hour,42,CAST(CAST([date_time_from] as date) as datetime)), [date_time_to]) as decimal(6,2))/60
--.08 --
	WHEN ([date_time_from] BETWEEN DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,24,CAST(CAST([date_time_from] as date) as datetime))
	 AND ([date_time_to]   BETWEEN DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from],[date_time_to]) as decimal(6,2))/60
--.09 --
	WHEN ([date_time_from] BETWEEN DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,24,CAST(CAST([date_time_from] as date) as datetime))
	 AND ([date_time_to]   BETWEEN DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,42,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from], DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60	
--.10 --	
	WHEN ([date_time_from] BETWEEN DATEADD(hour,18,CAST(CAST([date_time_from] as date) as datetime)) AND DATEADD(hour,24,CAST(CAST([date_time_from] as date) as datetime))
	 AND ([date_time_to]		>  DATEADD(hour,42,CAST(CAST([date_time_from] as date) as datetime))))
		THEN CAST(DATEDIFF(minute,[date_time_from], DATEADD(hour,31,CAST(CAST([date_time_from] as date) as datetime))) as decimal(6,2))/60
		   + CAST(DATEDIFF(minute,DATEADD(hour,42,CAST(CAST([date_time_from] as date) as datetime)), [date_time_to]) as decimal(6,2))/60
	ELSE	0
END	AS Shift_Differential															

  FROM [avl].[telestaff_import_time_apd]
  WHERE pay_code LIKE '1%'  ) AS t1
  WHERE Shift_Differential > 0
 -- ORDER BY	hours_worked
 -- ORDER BY pay_code
  ) AS tTS
  LEFT JOIN (
SELECT		EmpID, 
			PayID, 
			Absence, -- CATEGORY 3 = ABSENCE?
			SSN, 
			JobClass, 
            LocWorked, 
			UoM,
			Org, 
			Obj, 
            Proj
FROM        (
SELECT pr_job_pay.[a_employee_number] AS EmpID
      ,[e_ssn] AS SSN
      --,[a_activity_status]
      ,[a_location]
      ,pr_job_pay.[a_projection]
      ,[a_job_class_code] AS JobClass
      --,[a_primary_job_class]
      ,[a_pay_type] AS PayID
      ,[a_location] AS LocWorked
      ,[jb_job_calc_code]
      ,[a_position_code]
      ,[a_org] AS Org
      ,[a_object] AS Obj
      ,[s_d_proj] AS Proj
      ,[s_start_date]
      ,[s_end_date]
      ,[a_base_pay]
      ,[s_status]
      ,[s_emp_pay_type]
      ,[jb_status]
      ,[jb_pay_basis]
      ,[s_inactive]
      --,[e_supervisor]
	  ,PayTypes.Category 
	  ,ISNULL(PayTypes.UnitOfMeasure, '') AS UoM
	  ,IIF(PayTypes.Category='3','Y', 'N') AS Absence
  FROM (
  SELECT [JobPay].[a_projection],
       [JobPay].[a_employee_number],
       [JobPay].[a_job_class_code],
       [JobPay].[s_on_recur_scr_y_n],
       [JobPay].[a_pay_type],
       [JobPay].[s_line_sequence],
       [JobPay].[a_location],
       [JobPay].[a_bargain_unit],
       [JobPay].[jb_job_calc_code],
       [JobPay].[a_position_code],
       [JobPay].[g_grade],
       [JobPay].[gs_step_table],
       [JobPay].[gs_step_date],
       [JobPay].[gs_next_step_date],
       [JobPay].[s_earn_mult_fact],
       [JobPay].[s_days_per_year],
       [JobPay].[s_period_hours],
       [JobPay].[s_hours_per_day],
       [JobPay].[s_pay_periods],
       [JobPay].[s_frequency],
       [JobPay].[s_pay_scale],
       [JobPay].[s_work_sundays],
       [JobPay].[s_work_mondays],
       [JobPay].[s_work_tuesdays],
       [JobPay].[s_work_wednesdays],
       [JobPay].[s_work_thurdays],
       [JobPay].[s_work_fridays],
       [JobPay].[s_work_saturdays],
       [JobPay].[s_week_cyc1_y_n],
       [JobPay].[s_week_cyc2_y_n],
       [JobPay].[s_week_cyc3_y_n],
       [JobPay].[s_week_cyc4_y_n],
       [JobPay].[s_week_cyc5_y_n],
       [JobPay].[s_fulltime_percent],
       [JobPay].[a_salary_annual],
       [JobPay].[s_period_salary],
       [JobPay].[s_daily_rate],
       [JobPay].[s_hourly_rate],
       [JobPay].[s_compa_ratio],
       [JobPay].[s_earnings_limit],
       [JobPay].[r_risk],
       [JobPay].[a_org],
       [JobPay].[a_object],
       [JobPay].[s_d_proj],
       [JobPay].[s_start_date],
       [JobPay].[s_end_date],
       [JobPay].[a_allocation_code],
       [JobPay].[s_reference_salary],
       [JobPay].[s_ded_flag],
       [JobPay].[s_add_to_base_y_n],
       [JobPay].[a_base_pay],
       [JobPay].[s_salary_job_pay],
       [JobPay].[s_line_pay_amount],
       [JobPay].[s_daily_rate_jb],
       [JobPay].[s_hourly_rate_jp],
       [JobPay].[s_earning_limit_jp],
       [JobPay].[s_last_review_date],
       [JobPay].[s_next_review_date],
       [JobPay].[s_status],
       [JobPay].[g_next_grade],
       [JobPay].[s_next_step2],
       [JobPay].[s_next_period],
       [JobPay].[s_days_per_yr2],
       [JobPay].[s_period_nxt_hours],
       [JobPay].[s_salary_raise],
       [JobPay].[s_line_next_pay],
       [JobPay].[s_daily_rate_raise],
       [JobPay].[s_hourly_rt_raise],
       [JobPay].[s_earn_limit_raise],
       [JobPay].[s_contract_status],
       [JobPay].[s_emp_pay_type],
       [JobPay].[g_grade_level],
       [JobPay].[s_on_pay_scrn_y_n],
       [JobPay].[s_pay_months],
       [JobPay].[s_tenure_date],
       [JobPay].[s_contract_date],
       [JobPay].[s_hire_apprvl_date],
       [JobPay].[s_hire_apprvl_time],
       [JobPay].[s_benefit_status],
       [JobPay].[s_balloon_pay_y_n],
       [JobPay].[s_civil_serv],
       [JobPay].[s_prior_mths_exper],
       [JobPay].[s_prior_yrs_exper],
       [JobPay].[s_years_here],
       [JobPay].[s_hours_per_year],
       [JobPay].[s_days_per_period],
       [JobPay].[s_projected_salary],
       [JobPay].[s_remainsal_in_yr],
       [JobPay].[s_calendar_code],
       [JobPay].[s_work_sched_code],
       [JobPay].[s_frozen_o_f_m_n],
       [JobPay].[s_encumber_y_n],
       [JobPay].[s_remainpays_in_yr],
       [JobPay].[s_last_hrly_rt],
       [JobPay].[s_last_daily_rt],
       [JobPay].[s_last_per_sal],
       [JobPay].[s_last_step_date],
       [JobPay].[s_filler],
       [JobPay].[s_subj],
       [JobPay].[s_pending_pos],
       [JobPay].[s_civ_class],
       [JobPay].[s_civ_class_status],
       [JobPay].[s_civ_start_dt],
       [JobPay].[s_civ_prob_end_dt],
       [JobPay].[s_civ_expire_dt],
       [JobPay].[s_civ_retire_dt],
       [JobPay].[s_civ_designation],
       [JobPay].[s_civ_desig_status],
       [JobPay].[s_civ_comment],
       [JobPay].[s_civ_retire_num],
       [JobPay].[s_userdef1],
       [JobPay].[s_userdef2],
       [JobPay].[s_userdef3],
       [JobPay].[s_userdef4],
       [JobPay].[s_userdef5],
       [JobPay].[s_inactive],
       [JobPay].[s_flsa_ot],
       [JobPay].[a_job_class_descsh],
       [JobPay].[a_job_class_desc],
       [JobPay].[jb_summary_cat1],
       [JobPay].[jb_summary_cat2],
       [JobPay].[jb_status],
       [JobPay].[jb_bargain_unit],
       [JobPay].[jb_non_payroll_emp],
       [JobPay].[jb_eeo_part_full_t],
       [JobPay].[jb_eeo_class],
       [JobPay].[jb_eeo_function],
       [JobPay].[jb_risk_code],
       [JobPay].[jb_basepay_code],
       [JobPay].[jb_flsa_exmt_code],
       [JobPay].[jb_pos_control_y_n],
       [JobPay].[jb_grstep_tbl_y_n],
       [JobPay].[jb_min_grade],
       [JobPay].[jb_max_grade],
       [JobPay].[jb_min_step],
       [JobPay].[jb_max_step],
       [JobPay].[jb_pay_basis],
       [JobPay].[jb_min_pay],
       [JobPay].[jb_max_pay],
       [JobPay].[jb_annual_periods],
       [JobPay].[jb_sched_hours],
       [JobPay].[jb_gl_project],
       [JobPay].[jb_teacher_y_n],
       [JobPay].[jb_sub_teacher_y_n],
       [JobPay].[jb_calc_code],
       [JobPay].[jb_hrs_per_day],
       [JobPay].[jb_hrs_per_yr],
       [JobPay].[jb_days_per_yr],
       [JobPay].[jb_employee_type],
       [JobPay].[jb_sub_teach_code],
       [JobPay].[jb_longevity_type],
       [JobPay].[jb_day_per_month],
       [JobPay].[jb_incr_earn_days],
       [JobPay].[jb_filler],
       [JobPay].[jb_reference],
       [JobPay].[jb_gen_labor],
       [JobPay].[jb_calendar],
       [JobPay].[a_bargain_desc_sh],
       [JobPay].[a_bargain_desc],
       [JobPay].[a_location_desc_sh],
       [JobPay].[a_location_desc],
       [JobPay].[s_schedule],
       [JobPay].[s_team],
       [JobPay].[s_escrow],
       [JobPay].[s_last_dayhrs],
       [JobPay].[s_proj_seg1],
       [JobPay].[s_proj_seg2],
       [JobPay].[s_proj_seg3],
       [JobPay].[s_proj_seg4],
       [JobPay].[s_proj_allocation],
       [JobPay].[jb_days_worked],
       [JobPay].[jb_holding_project],
       [JobPay].[jb_holding_object],
       [JobPay].[jb_holding_org],
       [JobPay].[jb_market_rate],
       [JobPay].[jb_mid_rate],
       [JobPay].[a_role_key],
       [JobPay].[jb_segment1],
       [JobPay].[jb_segment2],
       [JobPay].[jb_segment3],
       [JobPay].[jb_segment4],
       [JobPay].[jb_segment5],
       [JobPay].[jb_segment6],
       [JobPay].[jb_segment7],
       [JobPay].[jb_segment8],
       [JobPay].[jb_service_id],
       [JobPay].[jb_state_position],
       [JobPay].[jb_user_defined1],
       [JobPay].[jb_user_defined2],
       [JobPay].[jb_schedule],
       [JobPay].[jb_team],
       [JobPay].[jb_proj_seg1],
       [JobPay].[jb_proj_seg2],
       [JobPay].[jb_proj_seg3],
       [JobPay].[jb_proj_seg4],
       [JobPay].[jb_hold_proj_seg1],
       [JobPay].[jb_hold_proj_seg2],
       [JobPay].[jb_hold_proj_seg3],
       [JobPay].[jb_hold_proj_seg4],
       [JobPay].[s_work_start_date],
       [JobPay].[s_work_end_date],
       [JobPay].[a_name_last],
       [JobPay].[s_middle_name],
       [JobPay].[a_name_first],
       [JobPay].[a_name_suffix],
       [JobPay].[e_dep_cd],
       [JobPay].[e_supervisor],
       [JobPay].[s_name_first],
       [JobPay].[s_name_middle],
       [JobPay].[s_name_last],
       [JobPay].[s_name_suffix],
       [JobPay].[primary_job]
  FROM [PayrollReportingServices].[JobPay]('munis')
      WHERE	primary_job = 'Y'
	AND a_projection = 0
	AND	s_inactive = 'A'
  ) AS pr_job_pay
  LEFT JOIN PayTypes	ON pr_job_pay.a_pay_type = PayTypes.Code
  LEFT JOIN (
      SELECT [EmployeeMaster].[a_projection],
      [EmployeeMaster].[a_employee_number],
      [EmployeeMaster].[e_ssn]
      FROM [PayrollReportingServices].[EmployeeMaster]('munis')
  ) AS pr_employee_master ON pr_job_pay.a_employee_number = pr_employee_master.a_employee_number  AND	pr_job_pay.a_projection = pr_employee_master.a_projection
    WHERE	primary_job = 'Y'
	AND pr_job_pay.a_projection = 0
	AND	s_inactive = 'A'
	) AS t1
	) AS tMunis
	ON	tTS.emp_id = tMunis.EmpID	AND
		tTS.pay_code = tMunis.PayID	
	) AS tF
WHERE	prtd_ssn IS NOT NULL



GO



----------------------------------
select count(*) from prtmatdt
where prtd_from >= '2/6/2021'
and prtd_loc like '12%'