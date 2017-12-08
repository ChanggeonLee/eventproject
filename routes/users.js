var express = require('express');
var router = express.Router();
var catchErrors = require('../lib/async-error');
var nodemailer = require('nodemailer');

// D.B 모델
const Event = require('../models/event');
const User = require('../models/user');
const Answer = require('../models/answer');
const JoinLog = require('../models/join-log');
const LikeLog = require('../models/like-log');
const Survey = require('../models/survey');
const Comment = require('../models/comment');

// // mailgun setting
// var mailgun = require("mailgun-js");
// var api_key = process.env.MAILGUN_API_KEY;
// var DOMAIN = process.env.MAILGUN_DOMAIN;
// var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});

// 로그인 확인
function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}

// 회원 가입 폼
function validateForm(form, options) {
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return 'Name is required.';
  }

  if (!email) {
    return 'Email is required.';
  }

  if (!form.password && options.needPassword) {
    return 'Password is required.';
  }

  if (form.password !== form.password_confirmation) {
    return 'Passsword do not match.';
  }

  if (form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// 회원 가입 페이지
router.get('/new',catchErrors((req,res,next)=>{
  res.render('users/new');
}));

// 회원 정보 수정 페이지
router.get('/setting/:id', needAuth ,catchErrors(async (req, res, next)=> {
  user = await User.findById(req.params.id);
  res.render('users/edit',{user:user});
}));

// manager
router.get('/management/:id',needAuth ,catchErrors(async (req, res, next)=> {
  user = await User.findById(req.params.id);
  if(!user.rootuser){
    // 관리자 권한없음
    req.flash('danger', '관리자 권한이 없습니다.');
    res.redirect('back');
  }else{
    users = await User.find();
    console.log(users);
    req.flash('success', '관리자 페이지에 오신걸 환영합니다.');
    res.render('users/manager',{users:users});
  }
}));

// 회원 정보 프로필
router.get('/show/:id',needAuth, catchErrors(async (req,res,next)=> {
  const user = await User.findById(req.params.id);
  res.render('users/show',{user:user});
}));

// 좋아요 페이지
router.get('/favorite/:id',needAuth, catchErrors(async (req,res,next) => {
  const logs = await LikeLog.find({author:req.params.id}).populate('event').populate('author');
  console.log(logs);
  res.render('users/favorite', {logs: logs});
}));

// 참여한 페이지
router.get('/join/:id',needAuth, catchErrors(async (req, res, next) => {
  const logs = await JoinLog.find({author:req.params.id}).populate('event').populate('author');
  console.log(logs);
  res.render('users/join', {logs: logs});
}));

// 작성한 이벤트
router.get('/myevent/:id',needAuth, catchErrors(async (req, res, next) => {
  const events = await Event.find({_id:req.params.id}).populate('survey').populate('author');
  if(!events){
    req.flash('danger', "이벤트가 없습니다.");
    res.redirect('back');
  }
  res.render('users/myevent',{events : events});
}));

// 회원 정보 수정 수행
router.put('/:id' ,needAuth ,catchErrors(async (req, res, next)=> {
  user = await User.findById(req.params.id);
  
  if(!user){
    res.flash('danger' , 'no users');
    return res.redirect('back');
  }
  
  user.name = req.body.name;
  user.email = req.body.email;

  if( !user.password ){
    res.flash('danger' , 'facebook , kakao 로그인 사용자는 개인정보 변경을 할 수 없습니다.');
    return res.redirect('back');
  }

  // 비밀 번호 입력이 없을경우 고려
  if(!req.body.now_password){
    // 비밀 번호 변경이 아닐때  
  }else if( !await user.validatePassword(req.body.now_password)){
    req.flash('danger' , 'not match password');
    return res.redirect('back');
  }else {
    user.password = await user.generateHash(req.body.new_password);

    console.log('이메일',user.email);

    // // mail gun을 사용하여 이메일을 보낸 부분
    // var data = {
    //   from: 'project-event@projectevent.com',
    //   to: user.email,
    //   subject: '비밀번호가 재설정 되었습니다.',
    //   text: '비밀번호가 재설정 되었습니다.'
    // };
    
    // mailgun.messages().send(data, function (error, body) {
    //   console.log(body);
    // });
    
    // node mail을 사용하여 이메일을 보낸 부분
    // 재설정 되었다고 이메일을 보내줘야된다.
    var transporter = nodemailer.createTransport({
      service: 'naver',
      auth: {
        user: process.env.N_ID,
        pass: process.env.N_PW
      }
    });

    var mailOptions = {
      from: process.env.N_ID,
      to: user.email,
      subject: 'Event 비밀 번호 변경!!',
      text: 'from.Event\n 사용자님의 이메일이 성공적으로 변경되었습니다.\n이러한 활동을 한 적이 없으신가요?\n계정 복구 방법에 대해 자세히 알아보려면 사이트의 하단의 문의 사항부분을 연락 해주세요~!.'
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  await user.save();
  req.flash('success', 'Registered successfully. Please sign in.');
  

  // 홈 화면으로 리다이렉트 해준다~
  res.redirect('/signout');

}));

// 종아요 취소
router.delete('/favorite/:id', needAuth, catchErrors(async (req, res, next) => {
  var favorite = await LikeLog.findById(req.params.id);
  const event = await Event.findById(favorite.event);
  event.numLikes--;
  await event.save(); 
  await favorite.remove();
  res.redirect('back');
}));

// 참여 취소 
router.delete('/join/:id', needAuth, catchErrors(async (req, res, next) => {
  var join = await JoinLog.findById(req.params.id);
  const event = await Event.findById(join.event);
  event.numAttendance--;
  await event.save();
  await join.remove();
  res.redirect('back');
}));
  
// 회원 탈퇴
router.delete('/:id' ,needAuth ,catchErrors(async (req, res, next)=> {
  // 삭제시에 자신의 이벤트 설문 , 댓글, 등등 다 지워야한다.
  if(req.user.rootuser){
    console.log("관리자 삭제");
    user = await User.findById(req.params.id);
    await Event.findOneAndRemove({author : user._id});
    await Answer.findOneAndRemove({author : user._id});
    await Comment.findOneAndRemove({author : user._id});
    await Survey.findOneAndRemove({author : user._id});
    await JoinLog.findOneAndRemove({author : user._id});
    await LikeLog.findOneAndRemove({author : user._id});
    await user.remove();
    res.redirect('back');
  }else{
    console.log("회원탈퇴");
    user = await User.findById(req.params.id);
    await Event.findOneAndRemove({author : user.id});
    await Answer.findOneAndRemove({author : user.id});
    await Comment.findOneAndRemove({author : user.id});
    await Survey.findOneAndRemove({author : user.id});
    await JoinLog.findOneAndRemove({author : user.id});
    await LikeLog.findOneAndRemove({author : user.id});
    await user.remove();
    res.redirect('/signout');
  }
}));

// 회원 가입 정보를 디비에 저장한다
// 에러 검사를 위해 catchErrors
router.post('/',catchErrors(async (req,res,next)=>{
  // 회원 가입 정보를 검사를 한다.
  var err = validateForm(req.body, {needPassword: true});
  // 예외처리를하고
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  var user = await User.findOne({email: req.body.email});
  // 이미 사용하고있는 사용자일 경우에도 에러처리를 한다.
  if (user) {
    req.flash('danger', 'Email address already exists.');
    return res.redirect('back');
  }
  user = new User({
    name : req.body.name,
    email : req.body.email,
  });
  console.log(user.name);
  user.password = await user.generateHash(req.body.password);
  // 새로운 사용자를 디비에 저장 한다
  await user.save();
  req.flash('success', 'Registered successfully. Please sign in.');
  // 홈 화면으로 리다이렉트 해준다~
  res.redirect('/');
}));

module.exports = router;




