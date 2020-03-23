const fs = require('fs');
const streamy = require('./streamy');


streamy.write(['1','2','3','4'])
streamy.write(['a','b','c','d'])
streamy.end()