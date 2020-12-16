const { parse } = require('date-fns');

let dtstr = [
    '2020-12-10 24:00:00',  // what telestaff calls 00:00 date-fns is calling 24:00
    '2020-12-10 01:00:00',
    '2020-12-10 02:00:00',
    '2020-12-10 03:00:00',
    '2020-12-15 1:00:00',
    '2020-12-15 2:00:00',
    '2020-12-15 3:00:00',
    '2020-12-16 22:00:00',
    '2020-12-16 23:00:00',

    '2020-12-20 0:00:00',
    '2020-12-20 00:00:00',
]

for(value of dtstr){
    let dt2 = value.replace(' 0:',' 24:').replace(' 00:',' 24:')
    let x = parse(dt2, "yyyy-MM-dd kk:mm:ss", new Date())

    console.log(value,x) // notice resulting dates are zulu
    console.log(!isNaN(x))
}
