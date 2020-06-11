var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');

var connect_db = require('../modules/connect_db.js');

/* GET all books */
router.get('/info/:user_id', function (req, res, next) {
    var user_id = req.params['user_id'];

    var user_info;
    var num_of_follower;

    var query_user_info = "SELECT user_id, name, avatar, type_of_user, phone_number FROM users WHERE user_id=" + user_id;
    connect_db.con.query(query_user_info, function(err1, result1) {
        if(err1) {
            res.send({status: 'error'});
            throw err1;
        }

        user_info = result1[0];
        var query_num_of_follower = "SELECT COUNT(followed_id) AS num_of_follower FROM followers WHERE followed_id=" + user_id + " GROUP BY followed_id";
        connect_db.con.query(query_num_of_follower, function(err2, result2) {
            if(err2) {
                res.send({status: 'error'});
                throw err2
            }
            if(result2[0] == undefined) {
                num_of_follower = {"num_of_follower": 0};
            } else {
                num_of_follower = result2[0];
            }

            res.send({status: 'success', user_info: user_info, num_of_follower: num_of_follower});
        })
    })
});

router.get('/book-owner/:user_id', function(req, res, next) {
    var user_id = req.params['user_id'];

    var query_selling_book = "SELECT B.book_id, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Đang bán' AND B.user_id=" + user_id + " GROUP BY B.book_id ORDER BY B.book_id DESC";
    connect_db.con.query(query_selling_book, function(err1, result1) {
        if(err1) {
            res.send({status: 'error'});
            throw err1;
        }

        var query_stop_selling_books = "SELECT B.book_id, B.title, B.status, B.price, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.selling_status='Ngừng bán' AND B.user_id=" + user_id + " GROUP BY B.book_id ORDER BY B.book_id DESC";
        connect_db.con.query(query_stop_selling_books, function(err2, result2) {
            if(err2) {
                res.send({status: 'error'});
                throw err2;
            }

            var query_watching_books = "SELECT B.book_id, B.title, B.status, B.price, B.selling_status, B.time_update, BI.image_path FROM books B INNER JOIN book_images BI INNER JOIN books_watching BW ON B.book_id=BI.book_id AND B.book_id=BW.book_id WHERE BW.user_id=" + user_id + " GROUP BY B.book_id ORDER BY B.book_id DESC"
            connect_db.con.query(query_watching_books, function(err3, result3){
                if(err3) {
                    res.send({status: 'error'});
                    throw err3
                }
                
                res.send({status: 'seccess', selling_books: result1, stop_selling_books: result2, watching_books: result3});
            })
        })
    })
})

router.get('/edit/book-status/:book_id', function(req, res, next) {
    var book_id = req.params['book_id'];
    var action = req.query.action;

    var status = ''; //Giá trị status của quyển sách sẽ sửa
    if(action == 'Ngừng bán') {
        status = 'Ngừng bán';
    } else if(action == 'Xóa') {
        status = 'Đã xóa';
    } else if(action == 'Tiếp tục bán') {
        status = 'Đang bán';
    }

    var query_edit_book = "UPDATE books SET selling_status = '" + status + "' WHERE books.book_id = " + book_id;
    console.log(query_edit_book);
    connect_db.con.query(query_edit_book, function(err, result) {
        if(err) {
            res.send({status: 'error'});
            throw err;
        }
        res.send({status: 'success'});
    })
})

router.get('/edit/book-watching/:user_id/:book_id', function(req, res, next) {
    var user_id = req.params['user_id'];
    var book_id = req.params['book_id'];

    var query_unwatching = "DELETE FROM books_watching WHERE user_id=" + user_id + " AND book_id=" + book_id;
    console.log(query_unwatching);
    connect_db.con.query(query_unwatching, function(err, result) {
        if(err) {
            res.send({status: 'error'});
            throw err;
        }
        res.send({status: 'success'});
    })
})

router.post('/edit/avatar/:id', function(req, res, next) {
    // Id của người dùng
    var user_id = req.params['id'];

    var form = new formidable.IncomingForm();
    form.uploadDir = './public/images/avatars';
    form.multiples = false;

    form.parse(req, function (err, fields, files) {

        fs.rename(files.photo.path, files.photo.path + '.jpg', function (err) {
            if (err) throw err;
        });

        // Do path có đường dẫn public\\images\\books\\upload_...
        // Nên phải convert lại đường dẫn
        var path = files.photo.path.replace('public', ''); // Xóa bỏ public ở đầu = cách thay thế thành ký tự ''
        path = path.replace(/\\/g, '/'); // Thay thế ký tự \\ bằng ký tự /

        var query_edit_avatar = "UPDATE users SET avatar = '" + path + ".jpg' WHERE users.user_id = " + user_id;
        
        connect_db.con.query(query_edit_avatar, function(err, result) {
            if(err) {
                res.send({status: 'error'});
                throw err
            }
            res.send({status: 'success'});
        })
    })
})

router.post('/edit/info/:id', function(req, res, next) {
    // Id của người dùng
    var user_id = req.params['id'];
    var name = req.body.name;
    var phone_number = req.body.phone_number;
    var type_of_user = req.body.type_of_user;

    var query_edit_info_account = "UPDATE users SET name = '" + name + "', type_of_user = '" + type_of_user + "', phone_number = '" + phone_number + "' WHERE users.user_id = " + user_id;
    
    connect_db.con.query(query_edit_info_account, function(err, result) {
        if(err) {
            res.send({status: 'error'});
            throw err;
        }
        res.send({status: 'success'});
    })
})

module.exports = router;
