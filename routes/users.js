var express = require('express');
var router = express.Router();
const catchErrors = require('../lib/async-error');
const User = require('../model/users');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/new',catchErrors((req,res,next)=>{
  res.render('users/new');
}));


// 회원 가입 정보를 디비에 저장한다
// 에러 검사를 위해 catchErrors
router.post('/',catchErrors((req,res,next)=>{
  // 회원 가입 정보를 검사를 한다.
  // 예외처리를하고
  // 이미 사용하고있는 사용자일 경우에도 에러처리를 한다.
  // 새로운 사용자를 디비에 저장 한다
  // 저장시에 비밀번호는 암호화허여 저장한다.
  // 홈 화면으로 리다이렉트 해준다~

}));




module.exports = router;
