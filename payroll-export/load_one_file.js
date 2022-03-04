
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const s3_client = new S3Client({ region: 'us-east-1' })
const fs = require('fs');
const Stream = require('stream');
const csv = require('csv');
const { parse, add } = require('date-fns');
const { Console } = require('console');

async function load_one_file(filenm, tablenm, sql) {
  try{
    const params = { Bucket: 'bedrock-data-files', Key: 'telestaff-payroll-export/' + filenm }
    const cmd = new GetObjectCommand(params)
    const { Body: s3_stream, response } = await s3_client.send(cmd)

    // Set up database insert
    const table = new sql.Table(tablenm) // or temporary table, e.g. #temptable
    table.create = false
    table.columns.add('source', sql.VarChar, { length: 32, nullable: true });
    table.columns.add('group', sql.VarChar, { length: 32, nullable: true });
    table.columns.add('emp_id', sql.Int, { nullable: true });
    table.columns.add('pay_code', sql.SmallInt, { nullable: true });
    table.columns.add('date_worked', sql.Date, { nullable: true });
    table.columns.add('hours_worked', sql.Float, { nullable: true });
    table.columns.add('note', sql.VarChar, { length: 128, nullable: true });
    table.columns.add('date_time_from', sql.DateTimeOffset, { nullable: true });
    table.columns.add('date_time_to', sql.DateTimeOffset, { nullable: true });

    // Set up writable to pipe to DB
    const pass = new Stream.Writable({
      objectMode: true,
      write: (data, _, done) => {
        table.rows.add(data[0], data[1], data[2], data[3], data[4], data[5], data[6], data[7], data[8], data[9])
        done()
      },
      final: () => {
        const request = new sql.Request();
        request.bulk(table, (err, result) => {
          if(err)console.log("err",err)
          console.log("DB Results",result)
          // sql.close()
        });
      }
    })

    // Pipe file downloaded from S3 to DB
    s3_stream
      .pipe(csv.parse({  // parse csv into object of strings
        bom: true,
        columns: true,
        cast: function (value, context) {
          if (context.column === 'from') {
            return value.replace(' 00:', ' 24:')            // "from" date format is '2020-05-03 8:00:00' 
          } else if (context.column === 'through') {
            return value.replace(' 00:', ' 24:').slice(0, 19) // "to" date format is '2020-05-03 08:00:00 EDT' 
          } else {
            return value;
          }
        }
      }))
      .pipe(csv.transform(function (data) { // choose and rename columns : correct data types
        return {
          source: 'Telestaff',
          group: data.institutionAbbreviation.substr(0, 32),
          emp_id: parseInt(data.employeePayrollID, 10),
          pay_code: parseInt(data.payrollCode, 10),
          date_worked: parse(data.from, "yyyy-MM-dd kk:mm:ss", new Date()),
          hours_worked: parseFloat(data.hours),
          note: data.rosterNote.substr(0, 128),
          date_time_from: parse(data.from, "yyyy-MM-dd kk:mm:ss", new Date()), // add(parse(data.from, "yyyy-MM-dd kk:mm:ss", new Date()), { hours: -5 }), // (datetimeoffset?) WARNING HARD CODED EST!!! Must change to -4 for Daylight Savings !?!?!
          date_time_to: parse(data.through, "yyyy-MM-dd kk:mm:ss", new Date()) // add(parse(data.through, "yyyy-MM-dd kk:mm:ss", new Date()), { hours: -5 }) // This used to work without the "add" but something changed :(
        }
      }))
      .pipe(csv.transform(function (data, callback) { //reject bad data
        if (
          typeof (data.source) === "string" &&
          typeof (data.group) === "string" &&
          typeof (data.emp_id) === "number" &&
          typeof (data.pay_code) === "number" && !isNaN(data.pay_code) &&
          !isNaN(data.date_worked) &&
          typeof (data.hours_worked) === "number" &&
          typeof (data.note) === "string" &&
          !isNaN(data.date_time_from) &&
          !isNaN(data.date_time_to)
          // Strings: typeof
          // Numbers: typeof but also check for NaN
          // Dates: date-fns will return NaN if invalid date
          //Object.prototype.toString.call(data.date_time_to) === '[object Date]' && 
        ) {
          let retdata = [
            data.source,
            data.group,
            data.emp_id,
            data.pay_code,
            data.date_worked,
            data.hours_worked,
            data.note,
            data.date_time_from,
            data.date_time_to
          ]
          callback(null, retdata);
        } else {
          callback(null, null);
        }

      }, {
        parallel: 20
      }))
      // .pipe(csv.stringify()).pipe(process.stdout)
      // .pipe(csv.stringify())
      .pipe(pass)
    }catch(err){
      console.log(err)
    }
}

module.exports = load_one_file

  //load_one_file('FD-payroll--T20200820-I000-S1597932617935.csv','avl.telestaff_import_time_apd',sql)