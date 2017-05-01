var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('ChatRoom', new Schema({
    roomname: String,
    user: [{
        userid:String,
        username:String
    }]
}));