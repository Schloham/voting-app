var mongoose = require('mongoose');

var Poll = mongoose.Schema({
    username: String,
    pollname: String,
    options: Array,
    optionsCount: Array
});

module.exports = mongoose.model('Poll', Poll);
