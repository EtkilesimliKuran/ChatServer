var express = require('express');
var RegId   = require('./models/reg_id');
var Hadis=require('./models/Hadis.js');
var Sunnet=require('./models/Sunnet');
var bodyParser  = require('body-parser');
var Kuran=require('./models/Kuran');
var config = require('./config');
var mongoose    = require('mongoose');
var FCM = require('fcm-push');
//var ios = require('socket.io');
mongoose.Promise = global.Promise;
mongoose.connect(config.database);
//var app = express();

var http = require('http');
app = module.exports.app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);  //pass a http.Server instance


app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
server.listen(app.get('port'));
console.log('Node app is running on port', app.get('port'));


/*app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});*/
app.get('/', function(request, response) {
    response.json({success:'hello world'});
});

app.post('/register', function(req, res){
    RegId.findOne({regID: req.body.regID},function (err, user) {

        if (err) throw err;

        if (!user) {
            var newuser = new RegId({
                regID: req.body.regID,
                user_choice: [""]
            });

            newuser.save(function (err, userid) {
                if (err) throw err;
                var userID = userid._id;
                res.json({success: true, userid: userID});
            });
        }
        else
        {

            res.json({success: true, userid: user._id});
        }
    })
});

app.post('/updatechoice',function (req,res) {
    RegId.findById(req.body.userid,function (err,user) {
        if(err) throw err;
        if (user.length !== 0) {
            RegId.findOneAndUpdate({_id: req.body.userid}, {$set:{user_choice:req.body.user_choice}}, {new: true}, function(err, doc){
                if(err){
                    console.log("Something wrong when updating data!");
                }

                res.json({message: "Seçim başarılı."});
            });

                    }
                });

})
app.post('/notification',function (req) {
    RegId.findById(req.body.userid,function (err,user) {
        if(err) throw err;
        if (user.length !== 0) {

        }
    });
    var serverkey = req.body.userid;
    var fcm = FCM(serverkey);
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: 'registration_token',
        collapse_key: 'your_collapse_key',

        notification: {
            title: 'Title of your push notification',
            body: 'Body of your push notification'
        },

        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    };
    fcm.send(message, function(err){
        if(err) throw err;
    });

})
var kullanicilar = {};

 io.sockets.on('connection', function (socket) { // tüm node işlemlerini kapsayan ana fonksiyonumuz





    socket.on('send_msg', function (data) {
        SendMsg(data);

    });


    function SendMsg(data) {

        var str=data["content"];
        var a,list=[];
        var arr = str.toString().split("#");
        if(!arr) {
            var tmp = str.toString().split(" ");
            var control=isNumeric(tmp[1]);
            if(control) {
                Kuran.find({"tefsir" :[{$or: [{"Surah":new RegExp('^'+tmp[0]+'$', "i")}]}]},function (err,mess) {
                    if(err) throw err;
                    if(mess.length!==0) {

                        socket.emit('message_list',mess);
                    }
                })
            }
            else
            {
                for(a=0;a<tmp.length;a++) {
                    Sunnet.find({"sunnetler": [{$or: [{"meal": new RegExp('^' + tmp[a] + '$', "i")}]}]}, function (err, mess) {
                        if (err) throw err;
                        if (mess.length !== 0) {

                           list.push(mess.sunnetler.meal);
                        }
                    })
                }
                socket.emit('message_list',list);
            }
        }
        else
        {
        Kuran.find({"tefsir" :[{$or: [{"meal":new RegExp('^'+arr[0]+'$', "i")}]}]},function (err,mess) {
            if(err) throw err;
            if(mess.length!==0) {

                socket.emit('message_list',mess);
            }
        })}
    }

     function isNumeric(num){
         return !isNaN(num)
     }

    socket.on("disconnect", function(){

        delete kullanicilar[socket.username];

        console.log(kullanicilar);
    });


});
