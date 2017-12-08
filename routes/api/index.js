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

// Join for Event
router.post('/event/:id/join', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    return next({status: 404, msg: 'Not exist event'});
  }

  var attendance = await JoinLog.find({event: event._id});
  console.log("참여자수",attendance.length);
  console.log("최대 참여자", event.attendance_max);
  if( event.attendance_max <= attendance.length ){
    console.log("인원이 가득 찼어요~")
    return res.json(event);
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

router.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    status: err.status,
    msg: err.msg || err
  });
});

module.exports = router;
