const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// signin page
router.get('/signin',catchErrors(async(req,res,next) => {
  res.render('signin');
}));

module.exports = router;
