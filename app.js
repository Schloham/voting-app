var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var config = require('./config');

mongoose.connect('mongodb://' + config.db.host + '/' + config.db.name);
var db = mongoose.connection;

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
var hbs = exphbs.create({
    helpers: {
        link: function(val) {
          var url = '/users/poll/' + val._id;
          var text = val.pollname;

          return "<a class=\"black-text\" href='" + url + "'>" + text + "</a>";
        },
        selectOptions: function(options) {
          var opts = "";
          for (var i = 0; i < options.length;i++) {
            opts += "<option value=" + i + ">" + options[i] + "</option>"
          }
          console.log(opts);
          return opts;
        },
        pollid: function(data) {
          console.log('id:' + data._id.toString());
          return "<input type=\"hidden\" name=\"pollid\" value=" + data._id.toString() + "></input>";
        },
        equal: function(one, two, data) {
          if (one == two) {
            return "<a class=\"red-text\" href=\"/users/poll/" + data._id + "/delete\">Delete Poll </a><a href=\"/users/poll/" + data._id + "/edit\">Edit</a>"
          }
        },
        twitter: function(data) {
          return "<a href=\"https://twitter.com/share?url=" + data.name + "&amp;text=" + data.name + "&amp;hashtags=vote\" target=\"_blank\"><img src=\"https://simplesharebuttons.com/images/somacro/twitter.png\" alt=\"Twitter\" /></a>"
        },
        formpollid: function(id) {
          return "<form method=\"post\" action=\"/users/poll/" + id + "/edit\" class=\"col s12\">"
        },
        formpollname: function(name) {
          return "<input id=\"pollname\" type=\"text\" class=\"validate\" name=\"pollname\" value=\"" + name + "\">"
        },
        formoptions: function(options) {
          var pollopts = "";
          for (var j = 0; j < options.length; j++) {
            pollopts += "<div class=\"row\"><div class=\"input-field col s12\"><input type=\"text\" class=\"validate\" name=\"options\" value=\"" + options[j] + "\"></div></div>"
          }
          return pollopts;
        },
        formoptionscount: function(count) {
          var optsCount = "";
          for (var l = 0; l < count.length; l++) {
            optsCount += "<input type=\"hidden\" class=\"validate\" name=\"optionsCount\" value=\"" + count[l] + "\">"
          }
          return optsCount;
        }
    },
    defaultLayout: 'layout'
});
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());


// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});


app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
