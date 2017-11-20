const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var schema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    name: {type: String, required: true, trim: true},
    locate: {type: String, required: true, trim: true},
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
        free: {type: Boolean, required: true, trim: true ,default: true},
        cost: {type: String, required: true, trim: true }
    },
    attendance_max: {type:Number, required: true, trim: true},
    attendance: {type:Number, required: true, trim: true},
    // 이미지가 들어가는 스키마가 필요함
    // 설문에 필요한 스키마를 추가할 거임
    createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

var Event = mongoose.model('Event', schema);

module.exports = Event;

