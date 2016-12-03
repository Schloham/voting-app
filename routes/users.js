var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var Poll = require('../models/poll');

// GET register page.
router.get('/register', function(req, res, next) {
  res.render('register');
});

// GET login page.
router.get('/login', function(req, res, next) {
  res.render('login');
});

// POST register page.
router.post('/register', function(req, res, next) {
  var name = req.body.name;
	var username = req.body.username;
  var email = req.body.email;
	var password = req.body.password;
	var password2 = req.body.password2;

  // Validation
  req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

  if (errors) {
    res.render('register', {
      errors: errors
    })
  } else {
    var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password
    })

    User.createUser(newUser, function(err, user) {
      if (err) throw err;
      console.log(user);
    });

    req.flash('success_msg', 'You are registered and can now log in');

    res.redirect('/users/login');
  }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, {message: 'Unknown User'});
      }
      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// POST login page
router.post('/login',
  passport.authenticate('local', {successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}),
  function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

router.get('/profile', ensureAuthenticated, function(req, res) {
  Poll.find({username: req.user.username}, function (err, data) {
    if (err) throw err;
    res.render('profile', {
      user: req.user,
      polls: data
    });
  });
});

router.get('/newpoll', ensureAuthenticated, function(req, res) {
  res.render('newpoll');
})

router.post('/newpoll', ensureAuthenticated, function(req, res, next) {
  var username = req.user.username;
  var pollname = req.body.pollname;
  var options = req.body.options;
  var optionsCount = req.body.options.map(function () {
    return 0;
  })

  req.checkBody('pollname', 'Pollname is required').notEmpty();
  req.checkBody('options', 'Options are required').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    res.render('newpoll', {
      errors: errors
    })
  } else {
    var newPoll = new Poll({
      username: username,
      pollname: pollname,
      options: options,
      optionsCount: optionsCount
    })

    newPoll.save(function (err, poll) {
      if (err) throw err;
      console.log(poll);
    });

    req.flash('success_msg', 'Poll has been created');

    res.redirect('/');
  }
})

router.get('/poll/:pollid', function(req, res) {
  Poll.findOne({_id: req.params.pollid}, function(err, data) {
    if (err) {
      throw err;
      return console.error(err);
    } else {
      res.render('poll', {
        data: data,
        user: req.user
      });
    }
  })
})

router.get('/poll/:pollid/json', function(req, res) {
  Poll.findOne({_id: req.params.pollid}, function (err, data) {
    if (err) throw err;
    if (!data) {
      res.render('views/error', {
      message: 'Not Found',
      error: {status: '404'}
      });
    } else {
      res.json(data.toJSON());
    }
  });
})

router.get('/poll/:pollid/delete', ensureAuthenticated, function(req, res) {
  Poll.remove({_id: req.params.pollid, username: req.user.username}, function(err, data) {
    if (err) throw err;
    req.flash('success_msg', 'Poll has been deletet');
    res.redirect('/users/profile');
  });
})

router.get('/poll/:pollid/edit', ensureAuthenticated, function(req, res) {
  Poll.findOne({_id: req.params.pollid}, function(err, data) {
    if (err) throw err;
    res.render('edit', {
      data: data,
      user: req.user
    })
  });
})

router.post('/poll/:pollid/edit', ensureAuthenticated, function(req, res) {
  Poll.findOne({_id: req.params.pollid}, function(err, data) {
    if (err) throw err;
    Poll.remove({_id: req.params.pollid}, function(err, data) {
      if (err) throw err;
      var newpoll = new Poll({
        username: req.user.username,
        pollname: req.body.pollname,
        options: req.body.options,
        optionsCount: req.body.optionsCount
      });
      newpoll.save(function (err, newpoll) {
        if (err) throw err;
        res.redirect('/users/poll/' + newpoll._id);
      });
    });
  });
})

router.post('/poll/vote', function(req, res) {
  console.log(req.body.selectPicker);
  if (req.body.selectPicker == undefined) {
    res.end();
  } else {
    Poll.findOne({_id: req.body.pollid}, function(err, data) {
      if (err) throw err;
      var newOptionsCount = data.optionsCount;
      newOptionsCount[req.body.selectPicker]++;
      Poll.update({_id: req.body.pollid}, {optionsCount: newOptionsCount}, function(err, data) {
        if (err) throw err;
        res.redirect('/users/poll/' + req.body.pollid);
      })
    })
  }
})

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

module.exports = router;
