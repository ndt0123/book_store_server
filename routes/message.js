var express = require('express');
var router = express.Router();

var connect_db = require('../modules/connect_db.js');

// Lấy tất cả cuộc trò chuyện của người dùng có id=user_id
router.get('/all-conversation/:user_id', function(req, res, next) {
    var user_id = req.params['user_id'];
    
    var query_conversation_user_1 = "SELECT CS.conversation_id, U.name, U.avatar, U.user_id, M.content, M.time, M.sending_id FROM conversations CS INNER JOIN users U INNER JOIN";
    query_conversation_user_1 += " (SELECT message.conversation_id, message.content, message.time, message.sending_id FROM message INNER JOIN (SELECT MAX(time) as max FROM message GROUP BY conversation_id) ";
    query_conversation_user_1 += "MT ON message.time=MT.max) M ON CS.user_id_2=U.user_id AND CS.conversation_id=M.conversation_id WHERE CS.user_id_1=" + user_id;

    var query_conversation_user_2 = "SELECT CS.conversation_id, U.name, U.avatar, U.user_id, M.content, M.time, M.sending_id FROM conversations CS INNER JOIN users U INNER JOIN";
    query_conversation_user_2 += " (SELECT message.conversation_id, message.content, message.time, message.sending_id FROM message INNER JOIN (SELECT MAX(time) as max FROM message GROUP BY conversation_id) "; 
    query_conversation_user_2 += "MT ON message.time=MT.max) M ON CS.user_id_1=U.user_id AND CS.conversation_id=M.conversation_id WHERE CS.user_id_2=" + user_id;
    
    connect_db.con.query(query_conversation_user_1, function(err1, result1) {
        if(err1) {
            res.send({
                status: 'error'
            });
            throw err1
        }

        connect_db.con.query(query_conversation_user_2, function(err2, result2) {
            if(err2) {
                res.send({
                    status: 'error'
                });
                throw err2;
            }

            var conversations = result1.concat(result2);

            // Sắp xếp lại cuộc trò chuyện theo thứ tự từ mới đến cũ
            for(var i=0; i<conversations.length; i++) {
                for(var j=i+1; j<conversations.length; j++) {
                    if(conversations[j].time > conversations[i].time) {
                        let conversation = conversations[i];
                        conversations[i] = conversations[j];
                        conversations[j] = conversation;
                    }
                }
            }

            res.send({
                conversations
            })
        })
    })
})

// Lấy tất cả tin nhắn của cuộc trò chuyện
router.get('/conversation/:conversation_id', function(req, res, next) {
    var conversation_id = req.params['conversation_id'];

    var query_all_message = "SELECT sending_id, content, type_of_message, time FROM message WHERE conversation_id=" + conversation_id;
    connect_db.con.query(query_all_message, function(err, result) {
        if(err) {
            res.send({
                status: 'error'
            })
            throw err;
        }

        res.send({
            messages: result
        })
    })
})

// Lấy avatar và tên của người chat cùng
router.get('/account_info/:user_id', function(req, res, next) {
    var user_id = req.params['user_id'];

    var query_info = "SELECT user_id, name, avatar FROM users WHERE user_id=" + user_id;
    connect_db.con.query(query_info, function(err, result) {
        if(err) {
            res.send({
                status: 'error'
            })
            throw err
        }

        res.send({
            partner_info: result[0]
        })
    })
})

// Kiểm tra xem có cuộc trò chuyện giữa hai user không
router.get('/conversation', function(req, res, next) {
    var user_id_1 = req.query.user_id_1;
    var user_id_2 = req.query.user_id_2;

    var query_conversation = "SELECT * FROM conversations WHERE user_id_1=" + user_id_1 + " AND user_id_2=" + user_id_2 + " OR user_id_1=" + user_id_2 +  " AND user_id_2=" + user_id_1;
    connect_db.con.query(query_conversation, function(err, result) {
        if(err) {
            res.send({
                status: 'error'
            })
            throw err;
        }

        if(result.length == 1) {
            res.send({
                conversation_id: result[0].conversation_id
            })
        } else {
            res.send({
                conversation_id: "undefined"
            })
        }
    })
})

// Thêm mới một cuộc trò chuyện vào csdl
router.get('/new-conversation', function(req, res, next) {
    let user_id_1 = req.query.user_id_1;
    let user_id_2 = req.query.user_id_2;

    var query_is_conversation_exist = "SELECT * FROM conversations WHERE user_id_1=" + user_id_1 + " AND user_id_2=" + user_id_2 + " OR user_id_2=" + user_id_1 + " AND user_id_1=" + user_id_2;
    connect_db.con.query(query_is_conversation_exist, function(err, result) {
        if(err) {
            throw err;
        }
        console.log(result.length);
        if(result.length == 0) {
            var insert_new_conversation = "INSERT INTO conversations (conversation_id, user_id_1, user_id_2) VALUES (NULL, '" + user_id_1 + "', '" + user_id_2 + "')";
            console.log(insert_new_conversation);
            connect_db.con.query(insert_new_conversation, function(err, result) {
                if(err) {
                    throw err;
                }
                res.send({
                    conversation_id: result.insertId
                })
            })
        }
    })
    
})

module.exports = router;