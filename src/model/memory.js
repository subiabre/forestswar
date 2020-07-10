"use strict"

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var memorySchema = new Schema({
    date: {
        type: Date,
        default: new Date().toString(),
        immutable: true
    },

    gladLatest: {
        type: Date,
        required: true
    },

    country: {
        type: Number,
        default: 0,
        required: true,
    },

    area: {
        type: Number,
        default: 0
    },

    countryDeforestatedArea: {
        type: Number,
        default: 0,
        required: true
    }
});

module.exports = mongoose.model('Memory', memorySchema);
