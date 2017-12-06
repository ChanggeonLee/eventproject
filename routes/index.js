const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');
const Event = require('../models/event');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
var User = require('../models/user');

// 홈페이지 설정
router.get('/', catchErrors( async(req, res, next) => {
  const events = await Event.find();
  res.render('index' , {events: events});
}));

// signin page
router.get('/signin',catchErrors(async(req,res,next) => {
  res.render('signin');
}));

// AWS 이미지 업로드
const S3_BUCKET = process.env.S3_BUCKET;
router.get('/s3', function(req, res, next) {
  const s3 = new aws.S3({region: 'ap-northeast-2'});
  const filename = req.query.filename;
  const type = req.query.type;
  const uuid = uuidv4();
  const params = {
    Bucket: S3_BUCKET,
    Key: uuid + '/' + filename,
    Expires: 900,
    ContentType: type,
    ACL: 'public-read'
  };
  console.log(params);
  s3.getSignedUrl('putObject', params, function(err, data) {
    if (err) {
      console.log(err);
      return res.json({err: err});
    }
    res.json({
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${uuid}/${filename}`
    });
  });
});

module.exports = router;
