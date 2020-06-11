var express = require('express');
var router = express.Router();

var connect_db = require('../modules/connect_db.js');

router.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    
    var query = "SELECT user_id FROM users WHERE username='" + username + "' AND password='" + password + "'";
    connect_db.con.query(query, function(err, result) {
        if(err) {
            res.send({status: 'error', error: 'Đã xảy ra lỗi'});
            throw err;
        }
        if(result.length != 1) {
            res.send({status: 'error', error: 'Tài khoản, mật khẩu không đúng'});
        } else {
            req.session.User = {
                user_id: result[0].user_id
            }
            // Trả về thông báo thành công và id của user
            res.send({status: 'success', user_id: req.session.User.user_id});
        }
    })
})

router.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        res.send({status: 'success'})
    })
})

router.post('/signin', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    // Query kiểm tra xem tài khoản đã tồn tại chưa
    // Nếu rồi thì trả về thông báo
    // Nếu chưa thì thêm vào csdl
    var query_select_user = "SELECT username FROM users WHERE username='" + username + "'";
    connect_db.con.query(query_select_user, function(err, result) {
        if(err) {
            res.send({status: 'error', error: 'Đã xảy ra lỗi'});
            throw err;
        }

        if(result.length != 0) {
            res.send({status: 'error', error: 'Tên tài khoản đã tồn tại'});
        } else {
            // Query thêm tài khoản vào csdl
            var query_insert_user = "INSERT INTO users (user_id, name, avatar, type_of_user, phone_number, username, password) VALUES (NULL, '" + username + "', '/images/avatars/default_user_avatar.jpg\r\n', 'Cá nhân', '', '" + username + "', '" + password + "')";
            connect_db.con.query(query_insert_user, function(err, result) {
                if(err) {
                    res.send({status: 'error', error: 'Đã xảy ra lỗi'});
                    throw err;
                }

                // Set biến session user
                req.session.User = {
                    user_id: result.insertId
                }
                // Trả về thông báo thành công và id của người dùng
                res.send({status: 'success', user_id: req.session.User.user_id});
            })
        }
    })
})

router.get('/get_user', function(req, res) {
    if(req.session.User) {
        res.send({loggedIn: true, user: req.session.User});
    } else {
        res.send({loggedIn: false});
    }
})

module.exports = router;