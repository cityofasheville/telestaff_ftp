var debugStream = require('debug-stream')('lil: ')
var fs = require('fs');
const csv = require('csv');

var Connection = require('tedious').Connection,
TYPES = require('tedious').TYPES;

require('dotenv').config({path:'./.env'})
const config = {
  dbConfig: {
      authentication: {
          type: "default",
          options: {
              userName: process.env.sql_user, 
              password: process.env.sql_pw, 
          }
      },
      server: process.env.sql_host,
      options: {
          database: process.env.sql_db,  
          encrypt: false
      }
  },
  ftpConfig: {
          host: process.env.ftp_host,
          username: process.env.ftp_user,
          password: process.env.ftp_pw,
          path: process.env.ftp_export_path
  }
}
var connection = new Connection(config.dbConfig);

const table = '[avl].[telestaff_import_time]';
const filenm = './payroll_export/output.csv';
let rowSource = fs.createReadStream(filenm, "utf8");

function loadBulkData() {
  var option = { keepNulls: true }; // option to honor null
  var bulkLoad = connection.newBulkLoad(table, option, function(err, rowCont) {
    if (err) {
      throw err;
    }
    console.log('rows inserted :', rowCont);
    connection.close();
  });
  // setup columns
  bulkLoad.addColumn('source', TYPES.VarChar, { length: 32, nullable: true });
  bulkLoad.addColumn('group', TYPES.VarChar, { length: 32, nullable: true });
  bulkLoad.addColumn('emp_id', TYPES.Int, { nullable: true });
  bulkLoad.addColumn('pay_code', TYPES.Int, { nullable: true });
  // bulkLoad.addColumn('date_worked', TYPES.Date, { nullable: true });
  bulkLoad.addColumn('hours_worked', TYPES.Decimal, { nullable: true });
  bulkLoad.addColumn('note', TYPES.VarChar, { length: 128, nullable: true });
  // bulkLoad.addColumn('date_time_from', TYPES.DateTime, { nullable: true });
  // bulkLoad.addColumn('date_time_to', TYPES.DateTime, { nullable: true });

  const rowStream = bulkLoad.getRowStream();
  connection.execBulkLoad(bulkLoad);

  rowSource
  .pipe(csv.parse({
    bom: true,
    from_line: 2,
    cast: function(value, context){
      if(context.index === 4){
        return `${value}T00:00:00.000Z`
      }else{
        return value
      }
    }
  }))
  .pipe(debugStream())
    .pipe(rowStream);

  }


connection.on('connect', function(err) {
  if (err) {
    console.log('Connection Failed');
    throw err;
  }
  loadBulkData();
});