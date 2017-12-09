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

// 이벤트 업로드 폼
function validateForm(form) {
  var title = form.title || "";
  var locate = form.locate || "";
  var detail_address = form.detail_address || "";
  var start_time_date = form.start_time_date || "";
  var start_time_time = form.start_time_time || "";
  var end_time_date = form.end_time_date || "";
  var end_time_time = form.end_time_time || "";
  var info = form.info || "";
  var organize = form.organize || "";
  var organize_info = form.organize_info || "";

  title = title.trim();
  locate = locate.trim();
  detail_address = detail_address.trim();
  start_time_date = start_time_date.trim();
  start_time_time = start_time_time.trim();
  end_time_date = end_time_date.trim();
  end_time_time = end_time_time.trim();
  info = info.trim();
  organize = organize.trim();
  organize_info = organize_info.trim();
  
  if (!title) {
    return '이벤트 이름을 입력해주세요';
  }

  if (!locate) {
    return '지역을 입력해주세요';
  }

  if (!detail_address) {
    return '상세 주소를 입력해주세요';
  }
  if (!start_time_date) {
    return '시작 날짜를 입력해주세요';
  }
  if (!start_time_time) {
    return '시작 시간을 입력해주세요';
  }
  if (!end_time_date) {
    return '종료 날짜를 입력해주세요';
  }
  if (!end_time_time) {
    return '종료 시간을 입력해주세요';
  }
  if (!info) {
    return '내용을 입력해주세요';
  }
  if (!organize) {
    return '등록 조직을 입력해주세요';
  }
  if (!organize_info) {
    return '등록 조직의 설명을 입력해주세요';
  }

  return null;
}

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
      sort: {numComments: -1},
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
  // await comments.answer.populate('author');
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

  var err = validateForm(req.body);
  // 예외처리를하고
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

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
  
  console.log("티켓 유무 : ",req.body);
  // 티켓 요금 설정
  if(req.body.free){
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
  await Comment.findOneAndRemove({event : event._id});
  await event.remove();

  res.redirect('/event/');
}));

// delete answer
router.delete('/answer/:id/', needAuth , catchErrors(async (req, res, next) => {
  await Answer.findByIdAndRemove(req.params.id);
  res.redirect('back');
}));

// delete comment
router.delete('/comment/:id/', needAuth , catchErrors(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id).populate('answer');
  const event = await Event.findById(comment.event);
  for (answer of comment.answer){
    await Answer.findByIdAndRemove(answer);
  }
  event.numComments--;
  await event.save();
  await comment.remove();

  res.redirect('back');
}));

// create new event 
router.post('/:id', needAuth, catchErrors( async(req, res, next)=> {
  var err = validateForm(req.body);
  // 예외처리를하고
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

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
  event.end_time.time = req.body.end_time_time;
  
  // 티켓 요금 설정
  if(req.body.free){
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
  const event = await Event.findById(req.params.id);
  const join_log = await JoinLog.findOne({author : req.user.id ,event :req.params.id});
  const user = await User.findById(req.user.id);
  var survey = await Survey.findOne({author : req.user.id});
  
  // 이벤트에 참여 하였는지 확인
  if(!join_log){
    req.flash("danger","이벤트에 참여를 해주세요");
  }else if(survey){
    // 설문을 하였는지 확인
    req.flash("danger","설문을 이미 완료 되었습니다");
  }else {
    survey = new Survey({
      event : req.params.id,
      name :  user.name,
      position : req.body.position,
      reasons : req.body.reasons
    });
    await event.survey.push(survey);
    await event.save();
    await survey.save();
    req.flash("success","설문이 완료되었습니다.");
  }
  res.redirect('back');
}));

// create new answer
router.post('/:id/answer', needAuth , catchErrors( async(req, res, next)=> {
  const user = req.user;
  const comment = await Comment.findById(req.params.id);
  const event = await Event.findById(comment.event);
  const author = await User.findById(user._id);

  if (!event) {
    req.flash('danger', '이벤트가 없습니다~');
    return res.redirect('/');
  }
  
  if(!comment){
    req.flash('danger', '등록된 댓글이 없습니다~');
    return res.redirect('/');
  }

  var answer = new Answer({
    author: user._id,
    name : author.name,
    event: event._id,
    content: req.body.content
  });

  comment.answer.push(answer);

  await answer.save();
  await comment.save();

  res.redirect('back');

}));

// create new comment
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
