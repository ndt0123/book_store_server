var express = require('express');
var router = express.Router();

var connect_db = require('../modules/connect_db.js');

/* GET book details */
router.get('/:id/details', function (req, res, next) {

    var book_id = req.params['id'];
    var query_book_details = "SELECT B.book_id, B.user_id, B.title, B.price, B.status, B.type_of_book, B.author, B.phone_number, B.position, B.describle, B.time_update, U.name, U.avatar FROM books B INNER JOIN users U on B.user_id=U.user_id WHERE B.book_id=" + book_id;
    connect_db.con.query(query_book_details, function (err_details, details) {
        if (err_details) throw err_details;

        var query_book_images = "SELECT image_path FROM book_images WHERE book_id=" + book_id;
        connect_db.con.query(query_book_images, function (err_images, images) {
            if (err_images) throw err_images;

            var query_comments = "SELECT C.comment_id, C.content, C.time_update, U.name, U.avatar FROM comment C INNER JOIN users U ON C.user_id=U.user_id WHERE C.book_id=" + book_id;
            connect_db.con.query(query_comments, function (err_comments, comments) {
                if (err_comments) throw err_comments;

                var query_comments_reply = "SELECT CR.comment_reply_id, CR.content, CR.time_update, C.comment_id, U.name, U.avatar FROM comment_reply CR INNER JOIN comment C INNER JOIN users U ON CR.comment_id=C.comment_id AND CR.user_id=U.user_id WHERE C.book_id=" + book_id;
                connect_db.con.query(query_comments_reply, function (err_comment_reply, comments_reply) {
                    if (err_comment_reply) throw err_comment_reply;

                    res.send({ details, images, comments, comments_reply });                    
                })

            })
        })
    });

});

// Kiểm tra xem người dùng đã đăng nhập có đang theo dõi người bán sách và quan tâm sách không
router.get('/:book_id/watching-following', function(req, res, next) {
    var book_id = req.params['book_id'];
    var user_id = req.query.user_id;

    var is_watching;
    var is_following;

    var query_is_watching = "SELECT * FROM books_watching WHERE book_id=" + book_id + " AND user_id=" + user_id;
    connect_db.con.query(query_is_watching, function(err1, result1) {
        if(err1) {
            throw err1;
        } 
        // Nếu kết quả trả về có nhiều hơn không record thì tức là có đang quan tâm
        if(result1.length == 0) {
            is_watching = false;
        } else {
            is_watching = true;
        }

        var query_book_owner_id = "SELECT user_id FROM books WHERE book_id=" + book_id;
        connect_db.con.query(query_book_owner_id, function(err2, result2) {
            if(err2) {
                throw err2;
            }
            var book_owner_id = result2[0].user_id;

            console.log(book_owner_id);
            var query_is_following = "SELECT * FROM followers WHERE follower_id=" + user_id + " AND followed_id=" + book_owner_id;
            connect_db.con.query(query_is_following, function(err3, result3) {
                if(err3) {
                    throw err3;
                } 
                // Nếu kết quả trả về có nhiều hơn không record thì tức là có đang theo dõi
                if(result3.length == 0) {
                    is_following = false;
                } else {
                    is_following = true;
                }

                res.send({is_watching: is_watching, is_following: is_following});
            })
        })

    })

}) 

// Lấy thông tin về nội dung và hình ảnh của sách
router.get('/book-info/:id', function (req, res, next) {

    var book_id = req.params['id'];
    var book_info;
    var book_images;

    var query_book_details = "SELECT * FROM books WHERE book_id=" + book_id;
    connect_db.con.query(query_book_details, function (err_details, details) {
        if (err_details) throw err_details;

        book_info = details[0];
        var query_book_images = "SELECT image_path FROM book_images WHERE book_id=" + book_id;
        connect_db.con.query(query_book_images, function (err_images, images) {
            if (err_images) throw err_images;
            book_images = images;

            res.send({ book_info, book_images });
        })
    });

});

// Lấy thông tin các quyến sách gợi ý
router.get('/:id/recommended', function (req, res, next) {
    var book_id = req.params['id'];

    var query_book_details = "SELECT title, price, author, type_of_book FROM books WHERE book_id=" + book_id;
    connect_db.con.query(query_book_details, function (err_details, details) {
        if (err_details) throw err_details;

        var query_book_recommended = "SELECT B.book_id, B.title, B.price, B.status, BI.image_path FROM books B INNER JOIN book_images BI ON B.book_id=BI.book_id WHERE B.title='" + details[0].title + "' OR B.author='" + details[0].author + "' OR B.type_of_book='" + details[0].type_of_book + "' OR B.price > " + details[0].price * 0.9 + " AND B.price < " + details[0].price * 1.1 + " GROUP BY B.book_id";
        connect_db.con.query(query_book_recommended, function (err_recommended, recommended) {
            if (err_recommended) throw err_recommended;

            res.send(recommended);
        })
    })
})

// Xử lý khi người dùng click theo dõi sách
router.get('/:book_id/watching', function(req, res, next) {
    var book_id = req.params['book_id'];
    var user_id = req.query.user_id;

    // Kiểm tra xem người dùng này đã quan tâm sách này chưa
    // Nếu chưa thì thêm record vào bảng còn rồi thì trả về thông báo
    var check_is_watching = "SELECT * FROM books_watching WHERE book_id=" + book_id + " AND user_id=" + user_id;
    connect_db.con.query(check_is_watching, function(err1, result1) {
        if(err1) {
            throw err1;
        }

        if(result1.length == 0) {
            // Thêm record vào bảng
            var query_insert_watching = "INSERT INTO `books_watching` (`book_id`, `user_id`) VALUES ('" + book_id + "', '" + user_id + "')";
            connect_db.con.query(query_insert_watching, function(err, result) {
                if(err) {
                    res.send({status: 'error'});
                    throw err;
                }

                res.send({status: 'success'});
            })
        } else {
            res.send({status: 'success'});
        }
    })
})

// Xử lý khi người dùng click hủy theo dõi sách
router.get('/:book_id/unwatching', function(req, res, next) {
    var book_id = req.params['book_id'];
    var user_id = req.query.user_id;

    var query_delete_watching = "DELETE FROM books_watching WHERE book_id=" + book_id + " AND user_id=" + user_id;
    connect_db.con.query(query_delete_watching, function(err, result) {
        if(err) {
            res.send({status: 'error'});
            throw err;
        }

        res.send({status: 'success'});
    })
})

// Xử lý khi người dùng click theo dõi người bán
router.get('/:book_owner_id/following', function(req, res, next) {
    var book_owner_id = req.params['book_owner_id'];
    var user_id = req.query.user_id;
    
    // Kiểm tra xem người dùng này đã theo dõi người bán chưa
    // Nếu chưa thì thêm record vào bảng còn rồi thì trả về thông báo
    var check_is_following = "SELECT * FROM followers WHERE follower_id=" + user_id + " AND followed_id=" + book_owner_id;
    connect_db.con.query(check_is_following, function(err1, result1) {
        if(err1) {
            throw err1;
        }

        if(result1.length == 0) {
            // Thêm record vào bảng
            var query_insert_following = "INSERT INTO `followers` (`follower_id`, `followed_id`) VALUES ('" + user_id + "', '" + book_owner_id + "')";
            connect_db.con.query(query_insert_following, function(err, result) {
                if(err) {
                    res.send({status: 'error'});
                    throw err;
                }

                res.send({status: 'success'});
            })
        } else {
            res.send({status: 'success'});
        }
    })
})

// Xử lý hủy theo dõi người bán
router.get('/:book_owner_id/unfollowing', function(req, res, next) {
    var book_owner_id = req.params['book_owner_id'];
    var user_id = req.query.user_id;
    
    var query_delete_following = "DELETE FROM followers WHERE follower_id=" + user_id + " AND followed_id=" + book_owner_id;
    connect_db.con.query(query_delete_following, function(err, result) {
        if(err) {
            res.send({status: 'error'});
            throw err;
        }

        res.send({status: 'success'});
    })
})

// Lấy toàn bộ nội dung comment
router.get('/comment/:book_id', function(req, res, next) {
    var book_id = req.params['book_id'];

    // Query các comment
    var query_comments = "SELECT C.comment_id, C.content, C.time_update, U.name, U.avatar FROM comment C INNER JOIN users U ON C.user_id=U.user_id WHERE C.book_id=" + book_id;
    connect_db.con.query(query_comments, function (err_comments, comments) {
        if (err_comments) {
            res.send({
                status: 'error'
            });
            throw err_comments
        };

        // Query các câu trả lời của comment
        var query_comments_reply = "SELECT CR.comment_reply_id, CR.content, CR.time_update, C.comment_id, U.name, U.avatar FROM comment_reply CR INNER JOIN comment C INNER JOIN users U ON CR.comment_id=C.comment_id AND CR.user_id=U.user_id WHERE C.book_id=" + book_id;
        connect_db.con.query(query_comments_reply, function (err_comment_reply, comments_reply) {
            if (err_comment_reply) {
                res.send({
                    status: 'error'
                });
                throw err_comment_reply
            };

            res.send({ 
                status: 'success',
                comments, 
                comments_reply 
            });                   
        })

    })
})

// Thêm comment vào csdl
router.post('/comment/:book_id/post-comment', function(req, res, next) {
    var book_id = req.params['book_id'];
    var id_user_comment = req.body.id_user_comment;
    var content = req.body.content;

    var query_insert_comment = "INSERT INTO comment (comment_id, book_id, user_id, content, time_update) VALUES (NULL, '" + book_id + "', '" + id_user_comment + "', '" + content + "', current_timestamp())";
    connect_db.con.query(query_insert_comment, function(err, result) {
        if(err) {
            res.send({
                status: 'error'
            });
            throw err;
        }
        

        res.send({
            status: 'success'
        })
    })
})

// Thêm comment reply vào csdl
router.post('/comment/:book_id/post-comment-reply', function(req, res, next) {
    var book_id = req.params['book_id'];
    var id_user_comment = req.body.id_user_comment;
    var content = req.body.content;
    var comment_id = req.body.comment_id;

    var query_insert_comment = "INSERT INTO comment_reply (comment_reply_id, comment_id, user_id, content, time_update) VALUES (NULL, '" + comment_id + "', '" + id_user_comment + "', '" + content + "', current_timestamp())";
    
    connect_db.con.query(query_insert_comment, function(err, result) {
        if(err) {
            res.send({
                status: 'error'
            });
            throw err;
        }

        res.send({
            status: 'success'
        })
    })
})

module.exports = router;
