let fs = require("fs");
let csv = require("csv");

let csvStream = csv.parse();

csvStream.on("data", function(data) {
  if(firstLine === true) {
    firstLine = false;
  } else {
    const newData = [ 'Telestaff',data[3],data[31],data[47],data[0],data[41],data[48],data[29],data[30] ]
    console.log(newData);
    writeStream.write(newData.join(',')+'\n');
  }
})
.on("end", function(){
    console.log("done");
})
.on("error", function(error){
    console.log(error);
});

const { Transform } = require('stream');
let readStream = fs.createReadStream("test.csv");
let writeStream = fs.createWriteStream("output.csv");

const upperCaseTr = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

readStream.pipe(upperCaseTr).pipe(writeStream);