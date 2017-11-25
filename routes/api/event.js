const express = require('express');
const Event = require('../../models/event');
const catchErrors = require('../../lib/async-error');

const router = express.Router();

// Index
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const events = await Event.paginate({}, {
    sort: {createdAt: -1}, 
    populate: 'author',
    page: page, limit: limit
  });
  res.json({events: events.docs, page: events.page, pages: events.pages});   
}));

// Read
router.get('/:id', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate('author');
  res.json(event);
}));

// // Create
// router.post('', catchErrors(async (req, res, next) => {
//   var event = new Event({
//     title: req.body.title,
//     author: req.user._id,
//     content: req.body.content,
//     tags: req.body.tags.map(e => e.trim()),
//   });
//   await question.save();
//   res.json(question)
// }));

// // Put
// router.put('/:id', catchErrors(async (req, res, next) => {
//   const question = await Question.findById(req.params.id);
//   if (!question) {
//     return next({status: 404, msg: 'Not exist question'});
//   }
//   if (question.author && question.author._id != req.user._id) {
//     return next({status: 403, msg: 'Cannot update'});
//   }
//   question.title = req.body.title;
//   question.content = req.body.content;
//   question.tags = req.body.tags;
//   await question.save();
//   res.json(question);
// }));

// // Delete
// router.delete('/:id', catchErrors(async (req, res, next) => {
//   const question = await Question.findById(req.params.id);
//   if (!question) {
//     return next({status: 404, msg: 'Not exist question'});
//   }
//   if (question.author && question.author._id != req.user._id) {
//     return next({status: 403, msg: 'Cannot update'});
//   }
//   await Question.findOneAndRemove({_id: req.params.id});
//   res.json({msg: 'deleted'});
// }));


module.exports = router;