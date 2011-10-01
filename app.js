/*
var express = require('express');
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/web/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/web/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.listen(3000);
console.log("BritBot on port %d in %s mode", app.address().port, app.settings.env);
*/

var irc = require('irc');
var redis = require('redis').createClient();

function ISO8601(d){
    // Ripped off the MDN, thanks guys!
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())
}

bot = new irc.Client('irc.mozilla.org', 'BritBot', {
    channels: ['#britbot'],
});

bot.addListener('message', function(from, to, message){
    var d = new Date();
    redis.rpush('logger:'+to+':'+ISO8601(d), '<'+from+'> '+message);
    console.log('logger:'+to+':'+ISO8601(d), '<'+from+'> '+message);
});