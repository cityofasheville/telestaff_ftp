function load_db_stub(filelist) {
    return new Promise(function(resolve, reject) {
        resolve(filelist) ;
    });
}

module.exports = load_db_stub;