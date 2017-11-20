const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');
var Event = require('../models/event');
var User = require('../models/user');

// 파일을 제어 하는 모듈
var formidable = require('formidable');
var AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-2';

AWS.config.update({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    region: 'ap-northeast-2'
});

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
  
  // // 기본 데이터 설정
  // event = new Event({
  //   author: req.user.id,
  //   name: req.body.name,
  //   locate: req.body.locate,
  //   info: req.body.info,
  //   organize: req.body.organize,
  //   organize_info: req.body.organize_info,
  //   event_type: req.body.event_type,
  //   event_field: req.body.event_field,
  //   attendance_max: req.body.attendance_max,
  // });

  // // 시작 시간 끝시간 설정
  // event.start_time.date = req.body.start_time_date;
  // event.start_time.time = req.body.start_time_time;
  // event.end_time.date = req.body.end_time_date;
  // event.end_time.time = req.body.end_time_date;
  
  // // 티켓 요금 설정
  // if(req.body.ticket_name){
  //   // 유료 티켓
  //   event.ticket.free = false;
  //   event.ticket.name = req.body.ticket_name;
  //   event.ticket.cost = req.body.ticket_price
  // }

  //else 무료 티켓
  // console.log(event);
  // console.log(req.body);

  // console.log(req.body.images);
  // console.log(req.body.images));

  // // 이미지 저장
  var form = new formidable.IncomingForm();
  // form.parse(req, function(err, fields, files){
  //   if(err){
  //     console.log(err);
  //   }
  //   var url;
  //   // const S3_Bucket = 'wpclassevent';
  //   const img_name = files.images;
  //   const UserId = req.user.id;
  //   console.log(files);
  //   console.log(fields);
  // });
  form.multiples = true;
  form.parse(req, function(err, fields, files){
    console.log(files);
    var url;
    // const S3_Bucket = 'jibang';
    // const img_name = files.roomimg.name;
    // const UserId = req.user.id;

    // if(img_name != ''){
    //     // 이미지 업로드
    //     var s3 = new AWS.S3();
    //     var params = {
    //          Bucket: S3_Bucket,
    //          Key:img_name,
    //          ACL:'public-read',
    //          Body: require('fs').createReadStream(files.roomimg.path)
    //     }
    //     s3.upload(params, function(err, data){
    //          var result='';
    //          if(err)
    //             // result = 'Fail';
    //             console.log(err);
    //          else
    //             console.log(data);
    //     });
    //     // 업로드 된 이미지 URL가지고 오기
    //     url = `https://${S3_Bucket}.s3.amazonaws.com/${img_name}`;    
    // }else{
    //     url = "#";
    // }
  });
  // res.redirect('back');
}));

module.exports = router;
