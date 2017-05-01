var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Message', new Schema({
    content: String,
    username: String,
    userid:String,
    roomid:String

}));