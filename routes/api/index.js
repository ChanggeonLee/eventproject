const express = require('express');
const catchErrors = require('../../lib/async-error');
const Event = require('../../models/event');
const User = require('../../models/user');
const JoinLog = require('../../models/join-log');
const LikeLog = require('../../models/like-log');
const router = express.Router();

router.use(catchErrors(async (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    next({status: 401, msg: 'Unauthorized'});
  }
}));

router.use('/event', require('./event'));

// Join for Event
router.post('/event/:id/join', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next({status: 404, msg: 'Not exist event'});
  }
  var joinLog = await JoinLog.findOne({author: req.user._id, event: event._id});
  if (!joinLog) {
    event.numAttendance++;
    await Promise.all([
      event.save(),
      JoinLog.create({author: req.user._id, event: event._id})
    ]);
  }
  return res.json(event);
}));

// Like for Event
router.post('/event/:id/like', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next({status: 404, msg: 'Not exist event'});
  }
  var likeLog = await LikeLog.findOne({author: req.user._id, event: event._id});
  if (!likeLog) {
    event.numLikes++;
    await Promise.all([
      event.save(),
      LikeLog.create({author: req.user._id, event: event._id})
    ]);
  }
  return res.json(event);
}));


// // Like for Answer
// router.post('/answers/:id/like', catchErrors(async (req, res, next) => {
//   const answer = await Answer.findById(req.params.id);
//   answer.numLikes++;
//   await answer.save();
//   return res.json(answer);
// }));

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    status: err.status,
    msg: err.msg || err
  });
});

module.exports = router;
