var express = require('express');
var router = express.Router();

var connect_db = require('../modules/connect_db.js');

// Kết quả các quyển sách phù hợp với tìm kiếm
// Khung tìm kiếm
router.get('/', function(req, res, next) {

    // Biến query 'key' người dùng gửi lên với nội dung tìm kiếm 
    var key = req.query.key;

    //Kết quả trả về
    var result = [];

    //phải xử lý bên phía người dùng nếu chỉ nhập các ký tự trống thì không tìm kiếm được

    //Câu query các quyển sách có tên gần giống với tìm kiếm
    var query_book_title = "SELECT B.book_id, B.type_of_book, B.author, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Đang bán' AND B.title LIKE '%" + key + "%' GROUP BY B.book_id ORDER BY B.book_id DESC";
    connect_db.con.query(query_book_title, function (err_title, result_title) {
        if (err_title) throw err_title;
        for(var i=0; i<result_title.length; i++) {
            result.push(result_title[i]);
        }
        
        //Câu query các quyển sách có tác giả trùng với tìm kiếm
        var query_book_author_exactly = "SELECT B.book_id, B.type_of_book, B.author, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Đang bán' AND B.author='" + key + "' GROUP BY B.book_id ORDER BY B.book_id DESC";
        connect_db.con.query(query_book_author_exactly, function(err_author_exactly, result_author_exactly) {
            if(err_author_exactly) throw err_author_exactly;
            for(var i=0; i<result_author_exactly.length; i++) {
                result.push(result_author_exactly[i]);
            }
            
            //Câu query các quyển sách có thể loại trùng với tìm kiếm
            var query_type_of_book_exactly = "SELECT B.book_id, B.type_of_book, B.author, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Đang bán' AND B.type_of_book='" + key + "' GROUP BY B.book_id ORDER BY B.book_id DESC";
            connect_db.con.query(query_type_of_book_exactly, function(err_type_of_book, result_type_of_book) {
                if(err_type_of_book) throw err_type_of_book;
                for(var i=0; i<result_type_of_book.length; i++) {
                    result.push(result_type_of_book[i]);
                }

                res.send(result);
            })
        })
    });

})

// Kết quả khi sử dụng bộ lọc
// Bộ lọc có thể có nhiều thành phần: tình trạng sách(book_status), thể loại sách(type_of_book)
router.get('/filter', function(req, res, next) {

    var query_book = "SELECT B.book_id, B.type_of_book, B.author, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Đang bán' ";

    // +=query với điều kiện tình trạng sách
    // Nếu req.query.book_status == 'Sách mới' thì điều kiện là B.status=100
    // Nếu req.query.book_status == 'Sách cũ' thì đk là B.status<100
    /*
        Kiểm tra nếu req.query.status_book != 'undefined' thì mới thêm vào biến query_book
     */
    if(typeof req.query.book_status != 'undefined') {
        
        // Biến lưu tình trạng sách (sách mới-sách cũ)
        var book_status = req.query.book_status.split(',');

        // Nếu chỉ có 1 điều kiện 'Sách mới' hoặc 'Sách cũ' tức là book_status.length=1
        // Nếu có cả 2 đk tức là book_status>1
        if(book_status.length == 1) {
            if(book_status[0].toLowerCase() == 'sách mới') {
                query_book += "AND ( B.status=100 ) ";
            } else if(book_status[0].toLowerCase() == 'sách cũ') {
                query_book += "AND ( B.status<100 ) ";
            }
        } else if(book_status.length > 1) {
            query_book += "AND ( B.status=100 OR B.status<100 ) ";
        }
    }
    
    if(typeof req.query.type_of_book != 'undefined') {
        var type_of_book = req.query.type_of_book.split(',');

        if(type_of_book.length == 1) {
            query_book += " AND ( B.type_of_book='" + type_of_book[0] + "' ) ";
        } else if(type_of_book.length > 1) {
            query_book += " AND ( B.type_of_book='" + type_of_book[0] + "' ";
    
            for(var i=1; i<type_of_book.length; i++) {
                query_book += " OR B.type_of_book='" + type_of_book[i] + "' ) ";
            }
        }
    }
    
    query_book += " GROUP BY B.book_id ORDER BY B.book_id DESC";

    connect_db.con.query(query_book, function (err, result) {
        if (err) throw err;
        res.send(result);
    });
})

// Gợi ý tìm kiếm
// Trả về các gợi ý phù hợp với tìm kiếm của người dùng
router.get('/recommend', function(req, res, next) {

    // Biến query lưu nội dung người dùng nhập vào khung tìm kiếm
    var key = req.query.key;

    // Kết quả trả về
    var result = [];
    var err;

    // Query các quyển sách có tiêu đề gần giống với tìm kiếm
    var query_title = "SELECT title FROM books WHERE title LIKE '" + key + "%'";
    connect_db.con.query(query_title, function(err_title, result_title) {
        if(err_title) {
            throw err_title;
            err = err_title;
            res.send(err);
        }

        for(var i=0; i< result_title.length; i++) {
            result.push(result_title[i].title);
        }

        // Query các quyển sách có tác giả gần giống với tìm kiếm
        var query_author = "SELECT author FROM books WHERE author LIKE '" + key + "%'";
        connect_db.con.query(query_author, function(err_author, result_author) {
            if(err_author) {
                throw err_author;
                err = err_author;
                res.send(err);
            }

            for(var i=0; i< result_author.length; i++) {
                result.push(result_author[i].author);
            }

            res.send(result);

        })
    })
})

// Lấy danh sách các thể loại sách
router.get('/list_type_of_book', function(req, res, next) {
    var query = 'SELECT type_of_book FROM books GROUP BY type_of_book';
    connect_db.con.query(query, function(err, result) {
        if(err) throw err;
        res.send(result);
    })
})

module.exports = router;