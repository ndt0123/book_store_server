var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "book_store",
    multipleStatements: true
});

module.exports.con = con;