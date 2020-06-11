var express = require('express');
var formidable = require('formidable');
var fs = require('fs');

var router = express.Router();

var connect_db = require('../modules/connect_db.js');

router.post('/image/:id', function(req, res, next) {

    // Id của quyển sách chứa hình ảnh này
    var book_id = req.params['id'];

    var form = new formidable.IncomingForm();
    form.uploadDir = './public/images/books';
    form.multiples = true;

    form.parse(req, function (err, fields, files) {

        // Biến lưu đường dẫn để thêm vào csdl
        var path_image = [];

        if(files.photo.length) {
            files.photo.forEach((image) => {
                fs.rename(image.path, image.path + '.jpg', function (err) {
                    if (err) throw err;
                });
    
                // Do path có đường dẫn public\\images\\books\\upload_...
                // Nên phải convert lại đường dẫn
                var path = image.path.replace('public', ''); // Xóa bỏ public ở đầu = cách thay thế thành ký tự ''
                path = path.replace(/\\/g, '/'); // Thay thế ký tự \\ bằng ký tự /
                path_image.push(path + '.jpg');
            })
        } else {
            fs.rename(files.photo.path, files.photo.path + '.jpg', function (err) {
                if (err) throw err;
            });

            // Do path có đường dẫn public\\images\\books\\upload_...
            // Nên phải convert lại đường dẫn
            var path = files.photo.path.replace('public', ''); // Xóa bỏ public ở đầu = cách thay thế thành ký tự ''
            path = path.replace(/\\/g, '/'); // Thay thế ký tự \\ bằng ký tự /
            path_image.push(path + '.jpg');
        }        

        // Query insert vào bảng image
        var query_insert_images = "INSERT INTO book_images (image_id, book_id, image_path) VALUES (NULL, '" + book_id + "', '" + path_image[0] + "')";
        for(var i=1; i<path_image.length; i++) {
            query_insert_images += ", (NULL, '" + book_id + "', '" + path_image[i] + "')";
        }

        connect_db.con.query(query_insert_images, function(err, result) {
            if(err) {
                res.send({status: 'error'});
                throw err;
            }

            res.send({status: 'success'});
        })
    })
})

router.post('/info', function(req, res, next) {

    var title = req.body.title_value;
    var price = req.body.price_value;
    var status = req.body.status_value;
    var phone_number = req.body.phone_number_value;
    var description = req.body.description_value;
    var author = req.body.author_value;
    var type_of_book = req.body.type_of_book_value;
    var position = req.body.position_value;
    var user_id = req.body.user_id;

    var query_insert_book = "";

    if(user_id != 0) {
        var query_insert_book = "INSERT INTO books (book_id, user_id, title, price, status, type_of_book, author, phone_number, position, describle, time_update, selling_status)";
        query_insert_book += " VALUES (NULL, '" + user_id + "', '" + title + "', '" + price + "', '" + status + "', '" + type_of_book + "', '" + author + "', '" + phone_number + "', '" + position + "', '" + description + "', current_timestamp(), 'Đang bán')";
        
        connect_db.con.query(query_insert_book, function(err, result) {
            if(err) {
                res.send({status: 'error'});
                throw err;
            }
            
            var id = result.insertId;
            res.send({status: 'success', book_id: id});
        })
    } else {
        res.send({status: 'error'});
    }
})

router.post('/edit/:book_id', function(req, res, next) {

    var title = req.body.title_value;
    var price = req.body.price_value;
    var status = req.body.status_value;
    var phone_number = req.body.phone_number_value;
    var description = req.body.description_value;
    var author = req.body.author_value;
    var type_of_book = req.body.type_of_book_value;
    var position = req.body.position_value;

    var book_id = req.params['book_id'];

    var query_edit_book = "UPDATE books SET title = '" + title + "', price = '" + price + "', status = '" + status + "', type_of_book = '" + type_of_book + "', author = '" + author + "', phone_number = '" + phone_number + "', position = '" + position + "', describle = '" + description + "' WHERE books.book_id = " + book_id;

    connect_db.con.query(query_edit_book, function(err, result) {
        if(err) {
            console.log(err);
            throw err;
        }
        
        res.send({status: 'success'});
    })
    
})

module.exports = router;