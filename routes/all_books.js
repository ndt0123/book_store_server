var express = require('express');
var router = express.Router();

var connect_db = require('../modules/connect_db.js');

/* GET all books */
router.get('/all-books', function (req, res, next) {

    var query_book = "SELECT B.book_id, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Đang bán' GROUP BY B.book_id ORDER BY B.book_id DESC";
    connect_db.con.query(query_book, function (err, result) {
        if (err) throw err;
        res.send(result);
    });
});

module.exports = router;
