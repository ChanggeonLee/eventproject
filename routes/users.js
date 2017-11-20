var express = require('express');
var router = express.Router();
var catchErrors = require('../lib/async-error');
var User = require('../models/user');
var nodemailer = require('nodemailer');

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}

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

  if( !await user.validatePassword(req.body.now_password)){
    req.flash('danger' , 'not match password');
    return res.redirect('back');
  }else{
    user.password = await user.generateHash(req.body.new_password);
  }

  await user.save();
  req.flash('success', 'Registered successfully. Please sign in.');
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
    subject: 'your password Changed!!',
    text: 'from.Event\n your password Changed!!'
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  // 홈 화면으로 리다이렉트 해준다~
  res.redirect('/signout');

}));

router.delete('/:id' ,needAuth ,catchErrors(async (req, res, next)=> {
  await User.findOneAndRemove(req.params.id);
  console.log("delete user id");
  res.redirect('/signout');
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




