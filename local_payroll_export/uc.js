// Simplest transform example
const { Transform } = require('stream');


const uc = new Transform({
    transform(chunk, encoding, callback) {
        callback(chunk.toString().toUpperCase());
    }
});

module.exports = uc;

