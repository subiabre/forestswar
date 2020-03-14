"use strict"

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var memorySchema = new Schema({
    date: {
        type: Date,
        default: new Date().toString(),
        immutable: true
    },

    country: {
        type: Number,
        default: 0,
        required: true,
    },

    area: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Memory', memorySchema);
