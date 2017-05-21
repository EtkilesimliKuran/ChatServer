var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Kuran', new Schema({

        Surah : String,
        AyahNo : Number,
        Meal: String,
        Tefsir: String,
        soundlink:String


}));