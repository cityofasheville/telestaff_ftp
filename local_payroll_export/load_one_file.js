const sql = require('mssql');
const fs = require('fs');
const csv = require('csv');
const { parse } = require('date-fns');
const {
    fix_data_sql,
    choose_columns,
    filter_bad_data
} = require('./transform_data');


require('dotenv').config({path:'./.env'})

async function load_one_file(filenm, pool) {
    try {
        let db_loader = csv.transform(function(data){
            return data;
        });
        const rowSource = fs.createReadStream('tmp/' + filenm, "utf8");
        rowSource
        .pipe(fix_data_sql)
        .pipe(choose_columns)
        .pipe(filter_bad_data)
        .pipe(db_loader);


        let request = await pool.request();
        request.stream = true;

        const table = new sql.Table('[avl].[telestaff_import_time]');
        table.create = true;
        // setup columns
        table.columns.add('source', sql.VarChar, { length: 32, nullable: true });
        table.columns.add('group', sql.VarChar, { length: 32, nullable: true });
        table.columns.add('emp_id', sql.Int, { nullable: true });
        table.columns.add('pay_code', sql.SmallInt, { nullable: true });
        table.columns.add('date_worked', sql.Date, { nullable: true });
        table.columns.add('hours_worked', sql.Decimal, { precision: 19, scale: 10, nullable: true });
        table.columns.add('note', sql.VarChar, { length: 128, nullable: true });
        table.columns.add('date_time_from', sql.DateTime, { nullable: true });
        table.columns.add('date_time_to', sql.DateTime, { nullable: true });

        db_loader.on('readable', function(){
            while(data = db_loader.read()){
                table.rows.add(data);
            }
        });  

        request.bulk(table);
	} catch(err) {
		throw new Error(err);
    }
    

    




//// OLD Terdious crud

      // const connection = new Connection(dbConfig);
      // connection.on('connect', function(err) {
      //   if (err) {
      //     console.error('Connection Failed3');
      //     reject(err);
      //   }
  
      //   // bulkLoad
      //   var option = { keepNulls: true }; 
      //   var bulkLoad = connection.newBulkLoad(table, option, function(err, rowCont) {
      //     if (err) {
      //       connection.close();
      //       reject(err);
      //     }
      //     console.log('Rows Inserted: ' + rowCont);
      //     connection.close();
      //   });
      //   // setup columns
      //   table.columns.add('source', sql.VarChar, { length: 32, nullable: true });
      //   table.columns.add('group', sql.VarChar, { length: 32, nullable: true });
      //   table.columns.add('emp_id', sql.Int, { nullable: true });
      //   table.columns.add('pay_code', sql.SmallInt, { nullable: true });
      //   table.columns.add('date_worked', sql.Date, { nullable: true });
      //   table.columns.add('hours_worked', sql.Decimal, { precision: 19, scale: 10, nullable: true });
      //   table.columns.add('note', sql.VarChar, { length: 128, nullable: true });
      //   table.columns.add('date_time_from', sql.DateTime, { nullable: true });
      //   table.columns.add('date_time_to', sql.DateTime, { nullable: true });
  
      //   const rowStream = bulkLoad.getRowStream();
      //   connection.execBulkLoad(bulkLoad);
  
      //   rowSource
      //   .pipe(csv.parse({ // parse takes buffers and returns objects
      //     bom: true,
      //     columns: true,
      //     cast: function(value, context){ // correct the data sql
      //       if(context.column === "hours") {
      //           return parseFloat(value);
      //       } else if(context.column === "employeePayrollID" || context.column === 'payrollCode') {
      //           return parseInt(value, 10);
      //       } else if(context.column === "payRangeFrom") {
      //           return parse(value, "yyyy-MM-dd", new Date());
      //       } else if(context.column === 'from' || context.column === 'through') {
      //           let datestr = `${value.slice(0,19)}`
      //           return parse(datestr, "yyyy-MM-dd kk:mm:ss", new Date());
      //       } else {
      //           return value;
      //       }
      //     }
      //   }))
      //   .pipe(csv.transform (function(data){ // choose and rename columns
      //     return { 
      //       source: 'Telestaff',
      //       group: data.institutionAbbreviation, 
      //       emp_id: data.employeePayrollID,
      //       pay_code: data.payrollCode,
      //       date_worked: data.payRangeFrom,
      //       hours_worked: data.hours,
      //       note: data.rosterNote, 
      //       date_time_from: data.from, 
      //       date_time_to: data.through
      //     } 
      //   }))
      //   .pipe(debugStream())
      //   .pipe(csv.transform (function(data, callback){ //reject bad data
      //       if(
      //         typeof(data.source) === "string" && 
      //         typeof(data.group) === "string" && 
      //         typeof(data.emp_id) === "number" && 
      //         typeof(data.pay_code) === "number" && !isNaN(data.pay_code) &&
      //         !isNaN(data.date_worked) &&
      //         typeof(data.hours_worked) === "number" && 
      //         typeof(data.note) === "string" && 
      //         !isNaN(data.date_time_from) &&
      //         !isNaN(data.date_time_to)
      //         // Strings: typeof
      //         // Numbers: typeof but also check for NaN
      //         // Dates: date-fns will return NaN if invalid date
      //         //Object.prototype.toString.call(data.date_time_to) === '[object Date]' && 
      //       ) {
      //           let retdata = [ 
      //             data.source, 
      //             data.group, 
      //             data.emp_id, 
      //             data.pay_code, 
      //             data.date_worked, 
      //             data.hours_worked, 
      //             data.note, 
      //             data.date_time_from, 
      //             data.date_time_to 
      //           ]
      //           callback(null, retdata);
      //         } else {
      //           callback(null, null);
      //         }
  
      //   }, {
      //     parallel: 20
      //   }))
      //   // 
      //   .pipe(rowStream);
      // });
      // resolve(filenm);
  }

  module.exports = load_one_file;