var express = require('express');
var RegId   = require('./models/reg_id');
var Hadis=require('./models/Hadis.js');
var Sunnet=require('./models/Sunnet');
var bodyParser  = require('body-parser');
var Kuran=require('./models/Kuran');
var config = require('./config');
var mongoose    = require('mongoose');
var FCM = require('fcm-push');
var url = require('url');
var request = require('request');
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

app = express(),server = require('http').createServer(app),io = require('socket.io').listen(server),
server.listen(process.env.PORT || 3000);

console.log('Node app is running on port 3000');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());



app.get('/', function(request, response) {

            response.json({mess:"Hey"})

})

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
                if(err) throw err;

                res.json({message: "Seçim başarılı."});
            });

                    }
                });

})

app.get('/surah',function (req,res) {

    var tmp = req.query.sure.toString().split(" ");

    var control=isNumeric(tmp[1]);

    if(control) {

        Kuran.findOne({"Surah":{ $regex: tmp[0], $options: 'i' },"AyahNo":tmp[1] },function (err,surah) {


            if(surah!==null&&surah.length!==0) {

                res.json({soundlink:surah["soundlink"],mess:surah["Meal"]});
            }

            else
               res.json({soundlink:" ",mess:"üzgünüm, bir sonuç bulamadım."});
        })
    }
    else
        res.json({soundlink:" ",mess:"üzgünüm, bir sonuç bulamadım. Lütfen düzgün formatta tekrar dene."});

})

app.get('/meal',function (req,res) {


    Kuran.findOne({"Meal":{ $regex:'^' +req.query.meal, $options: 'i' } }).limit(1).exec(function (err,meal) {
        if(err) throw err;
        if(meal!==null&&meal.length!==0) {
            var temp=" şu ayeti buldum."+meal["Surah"]+" "+meal["AyahNo"] +". ayet: "+meal["Meal"]

            res.json({soundlink:meal["soundlink"],mess:temp})
        }

        else
            res.json({soundlink:" ",mess:"üzgünüm, bir sonuç bulamadım."});
    })

})

app.get('/hadis',function (req,res) {

    Hadis.findOne({'HadisIcerigi':{ $regex:'^' +req.query.data, $options: 'i' } }).limit(1).exec(function (err,hadis) {

        if(err) throw err;
        if(hadis!==null&&hadis.length!==0) {
            var had="şu hadisi buldum, "+hadis["Kaynak"]+" kaynağında "+hadis["Ravi"]+"'dan rivayet edildiğine göre : "+hadis["HadisIcerigi"]
            res.json({mess:had})
        }

        else
            res.json({mess:"üzgünüm, bir sonuç bulamadım."});
    })

})

app.get('/tefsir',function (req,res) {

    Kuran.findOne({'Tefsir':{'$regex':'^'+req.query.tefsir, '$options' : 'i'}}).limit(1).exec(
        function(err, tefsir) {

            if(err) throw err;
            if(tefsir!==null&&tefsir.length!==0) {
                var tef=tefsir["Surah"]+" "+tefsir["AyahNo"]+". ayet "+tefsir["Tefsir"]
                res.json({mess:tef})
            }

            else
                res.json({mess:"üzgünüm, bir sonuç bulamadım."});

        });
})

app.get('/ayahtefsir',function (req,res) {

    var tmp = req.query.data.toString().split(" ");

    var control=isNumeric(tmp[1]);

    if(control) {

        Kuran.findOne({"Surah":{ $regex: tmp[0], $options: 'i' },"AyahNo":tmp[1] },function (err,tefsir) {

            if(err) throw err;

            if(tefsir!==null&&tefsir.length!==0) {

                res.json({mess:tefsir["Tefsir"]});
            }

            else
                res.json({mess:"üzgünüm, bir sonuç bulamadım."});
        })
    }
    else
        res.json({soundlink:" ",mess:"üzgünüm, bir sonuç bulamadım. Lütfen düzgün formatta tekrar dene."});
})

app.get('/sunnet',function (req,res) {

    Sunnet.findOne({'Content':{'$regex':req.query.sunnet, '$options' : 'i'}},
        function(err, sunnet) {
            if(err) throw err;

            if(sunnet!==null&&sunnet.length!==0) {

                res.json({mess:sunnet["Content"]})
            }

            else
                res.json({mess:"üzgünüm, bir sonuç bulamadım."});

        })
})

app.post('/notification',function (req,res){


    RegId.findById(req.body.userid,function (err,usr) {
        if(err) throw err;
        if(usr!==null) {
            var i;
            for(i=0;i<usr.user_choice.length;i++) {

                if (usr.user_choice[i] === "1")  {

                    Kuran.count().exec(function(err, count){

                        var random = Math.floor(Math.random() * count);

                        Kuran.findOne().skip(random).exec(
                            function (err, result) {

                                sendMessageToUser(
                                    "ayet",
                                    {message: result["Meal"]})


                            });

                    });

                }
                else if(usr.user_choice[i]=== "2") {

                    Sunnet.count().exec(function(err, count){

                        var random = Math.floor(Math.random() * count);

                        Sunnet.findOne().skip(random).exec(
                            function (err, result) {

                               sendMessageToUser(
                                    "sünnet",
                                    {message: result["Content"]})


                            });

                    });
                }

                else if(usr.user_choice[i]=== "3")
                    Hadis.count().exec(function(err, count){

                        var random = Math.floor(Math.random() * count);

                        Hadis.findOne().skip(random).exec(
                            function (err, result) {

                              sendMessageToUser(
                                    "hadis",
                                    {message: result["HadisIcerigi"]})

                            });

                    });

            }


        }
        else res.json("Basasırız")


    })

})


function sendMessageToUser(not,message) {
    request({
        url: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: {
            'Content-Type': ' application/json',
            'Authorization':'key=AAAAAWaWTyw:APA91bGhHVSrBfNW2i4Z-8jYvE6nW3smG7GvGC3pn69PzYDbnOSO0Cdbybe7UwgkhnZUFTlUYHYREvtds8VWTCEgpcVO53mZS5lDFspAQWtY3UiBUjQ-XV2asWNsxoCKANknDfSIUAqO',
            'Sender' : '6016093996'
        },
        body: JSON.stringify(
            {
                "data": {
                    "message": message
                },
                "to": 'fL8U-AvOyH8:APA91bEupNq_cdlEqTgh1e_0v-XXmNgD77oX9Ef_k6jSvpfERatHdMrnKj3SDhUewNGlLh8DMF_U01xzWUNQ3HETqWJeHeKS6qt4duu9ngl0LydABkiNpOMK9dqaGr1yBnvz3__NXJin',
                "content_available": true,
                "notification" : {
                    "body":"1 Yeni Bildirim",
                    "title":"Günlük "+not,
                    "click_action" :"ChatActivity"
                }
            }
        )
    }, function (error, response, body) {
        if (error) {
            console.error(error, response, body);
        }
        else if (response.statusCode >= 400) {
            console.error('HTTP Error: ' + response.statusCode + ' - ' + response.statusMessage + '\n' + body);
        }
        else {
            console.log('Done!')
        }
    });


}

function isNumeric(num){
    return !isNaN(num)
}



/*
 function sunnet(data, callback) {
 Sunnet.find({'Content':{'$regex':data, '$options' : 'i'}}).limit(5).exec(
 function(err, sunnet) {
 if(err) throw err;

 if(sunnet!==null) {

 callback(sunnet);
 }

 else
 callback("Başarısız");

 })
 }

 function tefsir(data,callback) {
 Kuran.find({'Tefsir':{'$regex':'^'+data, '$options' : 'i'}}).limit(5).exec(
 function(err, tefsir) {

 if(err) throw err;
 if(tefsir!==null) {
 callback(tefsir);
 }

 else
 callback("Başarısız");

 });

 }

 function hadis(data,callback) {

 Hadis.find({'HadisIcerigi':{'$regex':data, '$options' : 'i'}}).limit(5).exec(function (err,hadis) {

 if(err) throw err;
 if(hadis!==null) {
 callback(hadis);
 }

 else
 callback("Başarısız");
 })
 }

 function Surah(name,number,callback) {

 Kuran.find({"Surah":{ $regex: name, $options: 'i' },"AyahNo":number },function (err,surah) {


 if(surah!==null) {
 res.json(surah);
 }

 else
 callback("Başarısız");
 })
 }
 */
/*
 io.sockets.on('connection', function (socket) { // tüm node işlemlerini kapsayan ana fonksiyonumuz

    socket.on('send_msg', function (data) {

        SendMsg(data);

    });

     function SendMsg(data) {

         var source=data["source"];
         var str=data["content"];

         if(source==="0")
         {
             tefsir(str, function(err,result) {
                 if(err) throw err;
                 else
                     socket.emit("message_list",result)
             });

         }

         else if(source==="1")
         {
             var tmp = str.toString().split(" ");
             var control=isNumeric(tmp[1]);

             if(control) {
                 Surah(tmp[0],tmp[1], function(err,result) {
                     if(err) throw err;
                     else
                         socket.emit("message_list",result)
                 });

             }
             else
             {
                 meal(str, function(err,result) {
                     if(err) throw err;
                     else
                         socket.emit("message_list",result)
                 });
             }
         }

         else if(source==="2")
         {
             sunnet(str, function(err,result) {
                 if(err) throw err;
                 else
                     socket.emit("message_list",result)
             });
         }

         else if(source==="3")
         {
             hadis(str, function(err,result) {
                 if(err) throw err;
                 else
                     socket.emit("message_list",result)
             });
         }

    }

     function isNumeric(num){
         return !isNaN(num)
     }

    socket.on("disconnect", function(){


    });
  });


*/