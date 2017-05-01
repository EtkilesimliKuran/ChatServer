var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Kuran', new Schema({
    tefsir : [{
        Surah : String,
        Meal: String,
        Tefsir: String
    }]

}));