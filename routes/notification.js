var express = require('express');
var router = express.Router();

var connect_db = require('../modules/connect_db.js');

router.get('/all/:user_id', function(req, res, next) {
    var user_id = req.params['user_id'];

    res.send({
        user_id: user_id
    })
})

module.exports = router;