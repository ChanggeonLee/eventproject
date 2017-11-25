const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');
var Event = require('../models/event');
var User = require('../models/user');
const JoinLog = require('../models/join-log')

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
      {title: {'$regex': term, '$options': 'i'}}
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

// show event page
router.get('/:id' , catchErrors(async (req, res, next)=> {
  const event = await Event.findById(req.params.id).populate('author');
  const attendants = await JoinLog.find({event:req.params.id}).populate('author');
  event.numReads++;
  await event.save();
  res.render('event/show',{event : event , attendants : attendants});
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
  const event = await Event.findOneAndRemove(req.params.id);
  res.redirect('/event/');
}));

// create new event 
router.post('/:id', needAuth, catchErrors( async(req, res, next)=> {
  
  // 기본 데이터 설정
  event = new Event({
    author: req.user.id,
    title: req.body.title,
    locate: req.body.locate,
    info: req.body.info,
    organize: req.body.organize,
    organize_info: req.body.organize_info,
    event_type: req.body.event_type,
    event_field: req.body.event_field,
    attendance_max: req.body.attendance_max,
  });

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

  req.flash('success', '이벤트 생성 완료~');

  res.redirect('/');
}));

module.exports = router;
