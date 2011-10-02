var express = require('express');
var app = module.exports = express.createServer();
var irc = require('irc');
var redis = require('redis').createClient();

redis.on("error", function (err) {
  console.log("redis error " + err);
});

// Server Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Server Routes
app.get('/', function(req, res){
  res.render('index', {
    title: 'BritBot'
  });
});

app.get('/logger/:channel/', function(req, res){
  var channel = req.params.channel;
  redis.smembers('logger:#'+channel, function(err, logs){
    res.render('logger', {
      'title': 'Logs for #'+channel,
      'logs': logs,
      'links': 'true'
    });
  });
});

app.get('/logger/:channel', function(req, res){res.redirect('/logger/'+req.params.channel+'/')});

app.get('/logger/:channel/:date', function(req, res){
  var channel = req.params.channel;
  var date = req.params.date;
  redis.lrange('logger:#'+req.params.channel+':'+req.params.date, '0', '-1', function(err, logs){
    res.render('logger', {
      'title': 'Logs for #'+channel+' on '+date,
      'logs': logs,
      'links': 'false'
    });
  });
});

app.listen(3000);
console.log("BritBot on port %d in %s mode", app.address().port, app.settings.env);

function ISODateString(d){
    // Ripped off the MDN, thanks guys!
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'+ pad(d.getUTCMonth()+1)+'-'+ pad(d.getUTCDate())
}

function ISOTimeString(d){
    // Again, ripped off the MDN, thanks guys!
     function pad(n){return n<10 ? '0'+n : n}
     return pad(d.getUTCHours())+':'+ pad(d.getUTCMinutes())+':'+ pad(d.getUTCSeconds())
}

bot = new irc.Client('irc.mozilla.org', 'BritBot', {
    channels: ['#britbot'],
});

bot.addListener('message', function(from, to, message){
    if(to.match(/^[#&]/)){
        var d = new Date();
        var date = ISODateString(d);
        var time = ISOTimeString(d);
        redis.sadd('logger:'+to, date);
        redis.rpush('logger:'+to+':'+date, '['+time+'] <'+from+'> '+message);
    }
});

bot.addListener('join', function(channel, who){
  var d = new Date();
  var date = ISODateString(d);
  var time = ISOTimeString(d);
  redis.sadd('logger:'+channel, date);
  redis.rpush('logger:'+channel+':'+date, '['+time+'] --> '+who+' joined '+channel);
});

bot.addListener('part', function(channel, who, reason){
  var d = new Date();
  var date = ISODateString(d);
  var time = ISOTimeString(d);
  redis.sadd('logger:'+channel, date);
  redis.rpush('logger:'+channel+':'+date, '['+time+'] <-- '+who+' left '+channel+' ('+reason+')');
});

bot.addListener('kick', function(channel, who, by, reason){
  var d = new Date();
  var date = ISODateString(d);
  var time = ISOTimeString(d);
  redis.sadd('logger:'+channel, date);
  redis.rpush('logger:'+channel+':'+date, '['+time+'] <-- '+who+' was kicked from '+channel+' by '+by+' ('+reason+')');
});