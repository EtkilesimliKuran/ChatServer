var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Reg_Id', new Schema({
	regID: String,
	user_choice: [String]
}));