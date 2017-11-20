const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');
var Event = require('../models/event');
var User = require('../models/user');

function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/signin');
    }
}

router.get('/', catchErrors( async(req, res, next) => {
  res.render('index');
}));

router.get('/newevent', needAuth , catchErrors( async(req, res, next)=> {
  res.render('event/new');
}));

router.post('/:id', needAuth, catchErrors( async(req, res, next)=> {
  console.log(req.body);
}));

module.exports = router;
