var express = require('express');
var router = express.Router();
var Poll = require('../models/poll');

/* GET home page. */
router.get('/', function(req, res, next) {
  Poll.find({}, function (err, data) {
    if (err) throw err;
    res.render('index', {
      polls: data
    });
  });
});

module.exports = router;
