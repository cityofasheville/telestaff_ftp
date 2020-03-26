
const sql = require('mssql');


require('dotenv').config({path:'./.env'})
const config = {
    user: process.env.sql_user, 
    password: process.env.sql_pw, 
    server: process.env.sql_host,
    database: process.env.sql_db,
    options: { enableArithAbort: true }
}

async function run(){
    const table = new sql.Table('[avl].[telestaff_import_time]');
    let pool = await sql.connect(config);
    let request = await pool.request();
    request.stream = true;

    // setup columns
    table.columns.add('source', sql.VarChar(32), { nullable: true });
    table.columns.add('group', sql.VarChar(32), { nullable: true });
    table.columns.add('emp_id', sql.Int, { nullable: true });
    table.columns.add('pay_code', sql.SmallInt, { nullable: true });
    table.columns.add('date_worked', sql.Date, { nullable: true });
    table.columns.add('hours_worked', sql.Decimal(19,10), { nullable: true });
    table.columns.add('note', sql.VarChar(128), { nullable: true });
    table.columns.add('date_time_from', sql.DateTime, { nullable: true });
    table.columns.add('date_time_to', sql.DateTime, { nullable: true });
  table.rows.add('Telestaff', 'CAFD', 1092, 312, '2020-02-20T05:00:00.000Z', 12, 'notethis', '2020-02-20T13:00:00.000Z', '2020-02-21T13:00:00.000Z');
    //   table.rows.add('Telestaff', 'CAFD', 1092, 312, null, null, null, null, null);

    request.bulk(table);
} 
 run();