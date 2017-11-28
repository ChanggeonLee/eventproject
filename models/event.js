const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    // 이미지가 들어가는 스키마가 필요함
    title: {type: String, required: true, trim: true},
    locate: {type: String, required: true, trim: true},
    detail_address: {type: String, required: true, trim: true},
    start_time: {
        date:{type: String, required: true, trim: true},
        time:{type: String, required: true, trim: true}
    },
    end_time: {
        date:{type: String, required: true, trim: true},
        time:{type: String, required: true, trim: true}
    },
    info: {type: String, required: true, trim: true},
    organize: {type: String, required: true, trim: true},
    organize_info: {type: String, required: true, trim: true},
    event_type: {type: String, required: true, trim: true},
    event_field: {type: String, required: true, trim: true},
    ticket: {
        name: {type: String},
        free: {type: Boolean, default: true},
        cost: {type: String}
    },
    attendance_max: {type:Number, required: true, trim: true},
    // 좋아요 ,  응답 , 읽은 사람수
    numAttendance: {type:Number, default: 0},
    numLikes: {type: Number, default: 0},
    numAnswers: {type: Number, default: 0},
    numReads: {type: Number, default: 0},
    img: [String],
    // 설문에 필요한 스키마를 추가할 거임
    createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

schema.plugin(mongoosePaginate);
var Event = mongoose.model('Event', schema);

module.exports = Event;

