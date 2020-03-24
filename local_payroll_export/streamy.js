// based on samples/api.stream.js   "implementing the Node.js stream.Transform API"
// takes and returns objects
const csv = require('csv'); //( same as  require('stream-transform');)

const output = []
const streamy = csv.transform(function(data){
  data.push(data.shift())
  return data
})
streamy.on('readable', function(){
  while(row = streamy.read()){
    output.push(row)
  }
})
streamy.on('error', function(err){
  console.error(err.message)
})
streamy.on('finish', function(){
  //console.log(output);
})

module.exports = streamy;

