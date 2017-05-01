var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Hadis', new Schema({
    hadisler : [{
        Fasıl : String,
        Konu: String,
        Kaynak: String,
        Ravi: String,
        HadisIcerigi: String,
        KayitNo: String
    }]

}));