??????????wtf??????????
const stransform = require('stream-transform');
const { Transform } = require('stream');

const tr = new Transform({
    transform(chunk, encoding, callback) {
        const output = [];
        const transformer = stransform(function(data){
            data.push(data.shift());
            return data;
        })
        transformer.on('readable', function(){
            while(row = transformer.read()){
                output.push(row);
            }
        })
        transformer.on('error', function(err){
            console.error(err.message);
        })
        transformer.on('finish', function(){
            callback(output);
        });
}
module.exports = tr;   