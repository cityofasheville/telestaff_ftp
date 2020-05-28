let { differenceInWeeks } = require('date-fns')

function payrollweek() {
    // returns true or false if today is a payroll week
    let result = differenceInWeeks(
        new Date(),           // new Date(), // today
        new Date(2020, 3, 18) // new Date(2020, 3, 18) = 04/18/2020 (0 based month!) was Sat start of a payroll week
    )
    console.log(result)
    if(result % 2) {
        return false
    }else{
        return true
    }
}

module.exports = payrollweek


// console.log(payrollweek())
// console.log(new Date())
// console.log(new Date(2020, 3, 18))