const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');

// D.B models require
const Event = require('../models/event');
const User = require('../models/user');
const Comment = require('../models/comment');
const Answer = require('../models/answer');
const JoinLog = require('../models/join-log');
const LikeLog = require('../models/like-log');
const Survey = require('../models/survey');

// body-parser
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

// Check auth
function needAuth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      req.flash('danger', 'Please signin first.');
      res.redirect('/signin');
    }
}

// event index page
router.get('/', catchErrors( async(req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {locate: {'$regex': term, '$options': 'i'}},
      {event_field: {'$regex': term, '$options': 'i'}}
    ]};
  }
  const events = await Event.paginate(query, {
    sort: {createdAt: -1}, 
    populate: 'author', 
    page: page, limit: limit
  });
  res.render('event/index', {events: events, term: term, query: req.query});
  
}));

// new event page
router.get('/newevent', needAuth , catchErrors( async(req, res, next)=> {
  res.render('event/new',{
    event:{
      start_time:{},
      end_time:{},
      ticket: {}
  }});
}));

// get recommendation
router.get('/recommendation', catchErrors( async(req, res, next)=> {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  var query = {};
  const term = req.query.term;
  if (term) {
    query = {$or: [
      {title: {'$regex': term, '$options': 'i'}},
      {locate: {'$regex': term, '$options': 'i'}},
      {event_field: {'$regex': term, '$options': 'i'}}
    ]};
  }

  // 추천 이벤트 후기, 참여자 수, 지역 등
  var sort = req.query.topic;
  var title;
  var event;

  
  console.log(sort);

  if(sort == 'numLikes'){
     events = await Event.paginate(query, {
      sort: {createdAt: -1},
      sort: {numLikes: -1},
      populate: 'author', 
      page: page, limit: limit
    });
    title = '좋아요순 추천';
    console.log(title);
  }else if(sort == 'numAnswers'){
     events = await Event.paginate(query, {
      sort: {createdAt: -1},
      sort: {numAnswers: -1},
      populate: 'author', 
      page: page, limit: limit
    });
    title = '댓글순 추천';
    console.log(title);
  }else if(sort == 'numReads'){
     events = await Event.paginate(query, {
      sort: {createdAt: -1},
      sort: {numReads: -1},
      populate: 'author', 
      page: page, limit: limit
    });
    title = '읽은 사람순 추천';
    console.log(title);
  }else if(sort == 'numAttendance'){
     events = await Event.paginate(query, {
      sort: {createdAt: -1},
      sort: {numAttendance: -1},
      populate: 'author', 
      page: page, limit: limit
    });
    title = '참가자순 추천';
    console.log(title);
  }
  res.render('event/recommendation', {events: events, term: term, query: req.query , title : title});
}));

// show event page
router.get('/:id' , catchErrors(async (req, res, next)=> {
  const event = await Event.findById(req.params.id).populate('author');
  const comments = await Comment.find({event : req.params.id}).populate('author').populate('answer');
  const attendants = await JoinLog.find({event : req.params.id}).populate('author');
  event.numReads++;
  await event.save();
  res.render('event/show',{event : event , attendants : attendants , comments : comments });
}));

// edit event page
router.get('/:id/edit' , catchErrors(async (req , res, next)=> {
  const event = await Event.findById(req.params.id);
  res.render('event/edit' ,{ event : event});
}));

// change event page
router.put('/:id/', catchErrors(async (req, res, next)=>{
  var event = await Event.findById(req.params.id);
  // 기본 데이터 설정
  event.title = req.body.title;
  event.locate = req.body.locate;
  event.info = req.body.info;
  event.organize = req.body.organize;
  event.organize_info = req.body.organize_info;
  event.event_type = req.body.event_type;
  event.event_field = req.body.event_field;
  event.attendance_max = req.body.attendance_max;

  // 시작 시간 끝시간 설정
  event.start_time.date = req.body.start_time_date;
  event.start_time.time = req.body.start_time_time;
  event.end_time.date = req.body.end_time_date;
  event.end_time.time = req.body.end_time_date;
  
  // 티켓 요금 설정
  if(req.body.ticket_name){
    // 유료 티켓
    event.ticket.free = false;
    event.ticket.name = req.body.ticket_name;
    event.ticket.cost = req.body.ticket_price
  }

  // 이미지 저장
  // 설문
  await event.save();

  req.flash('success', '이벤트 수정 완료~');

  res.redirect('/');
}));

// delete event page
router.delete('/:id/', catchErrors(async (req, res, next)=> {
  const event = await Event.findById(req.params.id);
  await LikeLog.findOneAndRemove({event : event._id});
  await JoinLog.findOneAndRemove({event : event._id});
  await Survey.findOneAndRemove({event : event._id});
  await Answer.findOneAndRemove({event : event._id});
  await event.remove();

  res.redirect('/event/');
}));

// create new event 
router.post('/:id', needAuth, catchErrors( async(req, res, next)=> {
  // 기본 데이터 설정
  console.log(req.body);
  console.log(req.body.img);

  event = new Event({
    author: req.user.id,
    title: req.body.title,
    locate: req.body.locate,
    detail_address: req.body.detail_address,
    info: req.body.info,
    organize: req.body.organize,
    organize_info: req.body.organize_info,
    event_type: req.body.event_type,
    event_field: req.body.event_field,
    attendance_max: req.body.attendance_max,
  });

  event.img = req.body.img;

  // 시작 시간 끝시간 설정
  event.start_time.date = req.body.start_time_date;
  event.start_time.time = req.body.start_time_time;
  event.end_time.date = req.body.end_time_date;
  event.end_time.time = req.body.end_time_date;
  
  // 티켓 요금 설정
  if(req.body.ticket_name){
    // 유료 티켓
    event.ticket.free = false;
    event.ticket.name = req.body.ticket_name;
    event.ticket.cost = req.body.ticket_price
  }

  console.log(event);

  // 이미지 저장
  // 설문
  await event.save();

  req.flash('success', '이벤트 생성 완료~');

  res.redirect('/');
}));

// create new survey
router.post('/:id/survey', needAuth , catchErrors( async(req, res, next)=>{
  const user = req.user;
  const join_log = await JoinLog.findOne({author : user.id ,event :req.params.id});
  var survey = await Survey.findOne({author : user.id});
  
  // 이벤트에 참여 하였는지 확인
  if(!join_log){
    req.flash("danger","이벤트에 참여를 해주세요");
  }else if(survey){
    // 설문을 하였는지 확인
    req.flash("danger","설문을 이미 완료 되었습니다");
  }else {
    survey = new Survey({
      author : user.id,
      event : req.params.id,  
      position : req.body.position,
      reasons : req.body.reasons
    });
  
    await survey.save();
    req.flash("success","설문이 완료되었습니다.");
  }
  res.redirect('back');
}));

// create new answer
router.post('/:id/answer', needAuth , catchErrors( async(req, res, next)=> {
  const user = req.user;
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash('danger', '이벤트가 없습니다~');
    return res.redirect('/');
  }

  var answer = new Answer({
    author: user._id,
    event: event._id,
    content: req.body.content
  });

  await answer.save();
  event.numAnswers++;
  await event.save();

  res.redirect('back');

}));

router.post('/:id/comment', needAuth, catchErrors( async(req, res, next) => {
  const user = req.user;
  const event = await Event.findById(req.params.id);

  if (!event) {
    req.flash('danger', '이벤트가 없습니다~');
    return res.redirect('/');
  }

  var comment = new Comment({
    author: user._id,
    event: event._id,
    content: req.body.content
  });

  await comment.save();
  event.numComments++;
  await event.save();

  res.redirect('back');
}));

module.exports = router;
