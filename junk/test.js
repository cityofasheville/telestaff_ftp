const load_db = require('./load_db');

load_db( ['payroll-export--T20200304-I000-S1583341200625.csv','payroll-export--T20200305-I000-S1583427600712.csv'] )
.then(files_to_del => {
    console.log(files_to_del);
});
