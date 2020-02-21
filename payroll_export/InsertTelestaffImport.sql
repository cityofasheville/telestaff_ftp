USE [muntest]
GO

INSERT INTO [avl].[TelestaffImport]
           ([payRangeFrom]
           ,[payRangeThrough]
           ,[institutionName]
           ,[institutionAbbreviation]
           ,[institutionExternalID]
           ,[agencyName]
           ,[agencyAbbreviation]
           ,[agencyExternalID]
           ,[regionName]
           ,[regionAbbreviation]
           ,[regionExternalID]
           ,[stationName]
           ,[stationAbbreviation]
           ,[stationExternalID]
           ,[unitName]
           ,[unitAbbreviation]
           ,[unitExternalID]
           ,[vehicleName]
           ,[vehicleAbbreviation]
           ,[positionRankLevel]
           ,[positionRankName]
           ,[positionRankAbbreviation]
           ,[positionExternalID]
           ,[positionSpecialties]
           ,[positionShiftName]
           ,[positionShiftAbbreviation]
           ,[positionShiftFrom]
           ,[positionShiftThrough]
           ,[calendarDate]
           ,[from]
           ,[through]
           ,[employeePayrollID]
           ,[employeeWage]
           ,[employeeID]
           ,[employeeName]
           ,[shiftName]
           ,[shiftAbbreviation]
           ,[rankLevel]
           ,[rankName]
           ,[rankAbbreviation]
           ,[specialties]
           ,[hours]
           ,[hoursLeftOfShift]
           ,[hoursRightOfShift]
           ,[rosterSymbol]
           ,[rosterName]
           ,[rosterAbbreviation]
           ,[payrollCode]
           ,[rosterNote]
           ,[wageFactor]
           ,[cost]
           ,[detailCode]
           ,[logOpportunity]
           ,[logList]
           ,[logWorkCode]
           ,[accountCode]
           ,[causedByEmployeeName]
           ,[causedByEmployeeID]
           ,[causedByPayrollID]
           ,[causedByWage]
           ,[causedByRankLevel]
           ,[causedByRank]
           ,[causedByRankAbbreviation]
           ,[causedBySpecialties]
           ,[causedByHours]
           ,[causedByRosterName]
           ,[causedByRosterAbbreviation]
           ,[causedByPayrollCode]
           ,[causedByWageFactor]
           ,[causedByCost]
           ,[causedByDetailCode]
           ,[flsaHours]
           ,[rscNoIn]
           ,[rscMasterNoIn]
           ,[staffingNoIn]
           ,[holeStaffingNoIn]
           ,[staffBy]
           ,[towardFlsaHours]
           ,[flsaHoursShift]
           ,[flsaHoursTotal]
           ,[recordCount])
     VALUES
           (<payRangeFrom, date,>
           ,<payRangeThrough, date,>
           ,<institutionName, varchar(64),>
           ,<institutionAbbreviation, varchar(64),>
           ,<institutionExternalID, varchar(64),>
           ,<agencyName, varchar(64),>
           ,<agencyAbbreviation, varchar(64),>
           ,<agencyExternalID, varchar(64),>
           ,<regionName, varchar(64),>
           ,<regionAbbreviation, varchar(64),>
           ,<regionExternalID, varchar(64),>
           ,<stationName, varchar(64),>
           ,<stationAbbreviation, varchar(64),>
           ,<stationExternalID, varchar(64),>
           ,<unitName, varchar(64),>
           ,<unitAbbreviation, varchar(64),>
           ,<unitExternalID, varchar(64),>
           ,<vehicleName, varchar(64),>
           ,<vehicleAbbreviation, varchar(64),>
           ,<positionRankLevel, varchar(64),>
           ,<positionRankName, varchar(64),>
           ,<positionRankAbbreviation, varchar(64),>
           ,<positionExternalID, varchar(64),>
           ,<positionSpecialties, varchar(64),>
           ,<positionShiftName, varchar(64),>
           ,<positionShiftAbbreviation, varchar(64),>
           ,<positionShiftFrom, varchar(64),>
           ,<positionShiftThrough, varchar(64),>
           ,<calendarDate, varchar(64),>
           ,<from, varchar(64),>
           ,<through, varchar(64),>
           ,<employeePayrollID, varchar(64),>
           ,<employeeWage, varchar(64),>
           ,<employeeID, varchar(64),>
           ,<employeeName, varchar(64),>
           ,<shiftName, varchar(64),>
           ,<shiftAbbreviation, varchar(64),>
           ,<rankLevel, varchar(64),>
           ,<rankName, varchar(64),>
           ,<rankAbbreviation, varchar(64),>
           ,<specialties, varchar(64),>
           ,<hours, varchar(64),>
           ,<hoursLeftOfShift, varchar(64),>
           ,<hoursRightOfShift, varchar(64),>
           ,<rosterSymbol, varchar(64),>
           ,<rosterName, varchar(64),>
           ,<rosterAbbreviation, varchar(64),>
           ,<payrollCode, varchar(64),>
           ,<rosterNote, varchar(64),>
           ,<wageFactor, varchar(64),>
           ,<cost, varchar(64),>
           ,<detailCode, varchar(64),>
           ,<logOpportunity, varchar(64),>
           ,<logList, varchar(64),>
           ,<logWorkCode, varchar(64),>
           ,<accountCode, varchar(64),>
           ,<causedByEmployeeName, varchar(64),>
           ,<causedByEmployeeID, varchar(64),>
           ,<causedByPayrollID, varchar(64),>
           ,<causedByWage, varchar(64),>
           ,<causedByRankLevel, varchar(64),>
           ,<causedByRank, varchar(64),>
           ,<causedByRankAbbreviation, varchar(64),>
           ,<causedBySpecialties, varchar(64),>
           ,<causedByHours, varchar(64),>
           ,<causedByRosterName, varchar(64),>
           ,<causedByRosterAbbreviation, varchar(64),>
           ,<causedByPayrollCode, varchar(64),>
           ,<causedByWageFactor, varchar(64),>
           ,<causedByCost, varchar(64),>
           ,<causedByDetailCode, varchar(64),>
           ,<flsaHours, varchar(64),>
           ,<rscNoIn, varchar(64),>
           ,<rscMasterNoIn, varchar(64),>
           ,<staffingNoIn, varchar(64),>
           ,<holeStaffingNoIn, varchar(64),>
           ,<staffBy, varchar(64),>
           ,<towardFlsaHours, varchar(64),>
           ,<flsaHoursShift, varchar(64),>
           ,<flsaHoursTotal, varchar(64),>
           ,<recordCount, varchar(64),>)
GO


