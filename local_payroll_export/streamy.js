const transform = require('stream-transform');

const output = []
const streamy = transform(function(data){
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

})

module.exports = streamy;

