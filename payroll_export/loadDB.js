// USAGE:
// File Name + '.csv' must match Table Name
//Files are tab delimited
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const { server, username, password, database } = require('./config.json');
const importsPath = __dirname + "/imports/";
const sqlsPath = __dirname + "/sqls/";
let logFile = __dirname + '/logfile.txt';

let schemas = [];

fs.readdir(importsPath, function(err, items) {  //read imports folder
    let tableNameStr = items.map( 
        function(item){
            return "'" + item.slice(0,-4) + "'";
        }
    ).join(',');
    let tableArr = items.map(  //array of tablenames
        function(item){
            return item.slice(0,-4);
        }
    )    
    getSchemas(tableArr,tableNameStr);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Go to database with list of table names pulled from files. Extract data types.
const getSchemas = function(tableArr,tableNameStr) {
    
    
    let row;
    let schemaQuery = "SELECT '~' + rtrim(TABLE_NAME) + '~' + rtrim(COLUMN_NAME) + '~' + rtrim(DATA_TYPE) + '~' + rtrim(ORDINAL_POSITION) + '~'"
                    + " from INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN (" 
                    + tableNameStr 
                    + ") AND COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsIdentity') <> 1 ORDER BY TABLE_NAME, ORDINAL_POSITION";
    //console.log(schemaQuery);
    const bat = spawn('cmd.exe', ['/c', 'sqlcmd', '-S', server, '-U', username, '-P', password, '-d', database, '-l', '30', '-Q', schemaQuery ]);
    
    bat.stdout.on('data', (data) => {
        data.toString('utf8')
        //.replace(/\n/g,"")
        .split('~') //separate into array
        .slice(1)  //remove header row
        .forEach((element,ix)=>{  //console.log(element);
            let alphanum = element.trim();
            switch(ix % 5) { //columns 0-3 plus one 
                case 0: // tablename
                    row = [];
                    row.push(alphanum);
                    break;
                case 1: // column name
                    row.push(alphanum);
                    break;
                case 2: // data type
                    row.push(alphanum);
                    break;
                case 3: //col num
                    row.push(alphanum);
                    schemas.push(row);
                    break;
                case 4: //space -throw out
                    break;
            }
        });
    });
    
    bat.stderr.on('data', (data) => {
      console.log(data.toString());
    });
    
    bat.on('exit', (code) => {
        if(code===1) { console.log('Error getting schemas') };
            //console.log(schemas);
        tableArr.forEach(function(tableName){
            processFile(tableName,(tbl)=>{
                console.log('Created file "' + tbl + '.sql"');
                sendTable(tbl);
            })
        });
    });

   
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const processFile = function(tableName,done) { 
    let invalidFlag = false;
    const srcPath = importsPath + tableName + '.csv';
    const destPath = sqlsPath + tableName + '.sql';
    const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/; 
    const datetimeRegex = /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2}) (\d{2}) (\w{2})/; 
    const timeRegex = /(\d{2}:\d{2}:\d{2}) (\d{2}) (\w{2})/;         
    const rowsToSend = 1000;

    let newLine;
    let firstLine = true;
    let linenumber = 0;

    const schemaForTable = schemas.filter(schema=>schema[0].toUpperCase()===tableName.toUpperCase());

    const columnArray = schemaForTable //table columns from database
        .map( 
            function(item){ 
                return item[1];
            }
        )
    if(columnArray.length==0){
        console.log("Table not found: '" + tableName + "'");
        process.exit(1);
    }

    const columnList = columnArray
        .map( col => '[' + col + ']' ) 
        .join(','); 

    let rl = readline.createInterface({
        input: fs.createReadStream(srcPath)
    });
    let output = fs.createWriteStream(destPath)
        .on('finish', () => {
            done(tableName);
        })

    rl.on('line', (line) => {
        //break apart line into fields
        let fields = line
            .replace(/\t$/,'') //remove tab at end of line (if there!)
            .split('\t'); // split into array

        if(fields.length != columnArray.length) {
            if(linenumber===0){
                console.log("Number of columns doesn't match table: '" + tableName + "'");
            }else{
                console.log("There might be a newline or a tab in a character field: '" + tableName + "' line number " + linenumber);                
            }
            //process.exit(1);
        }

        if(firstLine) {
            //Test if file and table match
            fields.forEach(function(field,ix){  
                if(!columnArray[ix]){
                    console.log("No column: " + field.toUpperCase() + " in table: '" + tableName + "'");
                    process.exit(1);
                }else if(field.toUpperCase() !== columnArray[ix].toUpperCase()){
                    console.log("Unmatched columns in table: '" + tableName + "' File: '" + field.toUpperCase() + "' Table: '" + columnArray[ix].toUpperCase() + "'");
                    process.exit(1);
                }
            })
            
            firstLine = false;
            output.write("delete from [" + tableName + "]");
            return;
        }else{linenumber++;}

        if(linenumber%rowsToSend===1){ //first of set
            newLine = "\n go \n insert into [" + tableName + "](" + columnList + ") values (";
        } else {
            newLine = ",(";
        }
            
        fields.forEach((field,ix)=>{
            if(!schemaForTable[ix]){ return; }
            const dataType = schemaForTable[ix][2];

            if(dataType==="bit"){
                if(field==="T"){  field=1;  }
                else if(field==="F"){ field=0; }else{ field='NULL'}
            }else if(dataType==="date"){ 
                field = "'" + field.replace(/00\/00\/0000/g,'01/01/1900').replace(dateRegex, '$3-$1-$2') + "'";
            }else if(dataType==="datetime"){ 
                field = "'" + field.replace(/00\/00\/0000/g,'01/01/1900').replace(datetimeRegex, '$3-$1-$2 $4.$5 $6') + "'";
            }else if(dataType==="time"){ 
                field = "'" + field.replace(timeRegex, '$1.$2 $3') + "'";
            }else {   // if(dataType==="char"||dataType==="varchar"||dataType==="time"){
                field = "'" + field.replace(/'/g,"''") + "'";
            }
            newLine = newLine + field + ","; //build back whole line
        });
        
        output.write(newLine.slice(0,-1) + ')\n');
        
    }).on('close', () => {
        output.end();
    });

}



const sendTable = function(tableName){ 
    let rowCnt = 0;
    let uploadFile = sqlsPath + tableName + '.sql'; 

    const bat = spawn('cmd.exe', ['/c', 'sqlcmd', '-S', server, '-U', username, '-P', password, '-d', database, '-l', '30', '-i', uploadFile ]);

    bat.stdout.on('data', (data) => {
        //rowCnt = data.toString().match(/(\d+)/g,'$1');  (\r\n)\s*(\r\n)|^(\r\n)|(\r\n)$
        //console.log(rowCnt + ' rows affected table \'' + tableName + '\'');
        message = data.toString().replace(/\n*/g,'')
            .replace(/(\d+) rows affected/g,'$1 rows: Table \'' + tableName + '\'');
        console.log(message);
    });

    bat.stderr.on('data', (data) => {
        console.log(data.toString());
    });

    bat.on('exit', (code) => {
        if(code===1) { console.log('Error sending file "' + tableName + '.sql"'); return; };
    });

}