"use strict"

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var alertSchema = new Schema({
    dateLocal: {
        type: Date,
        default: new Date().toString(),
        immutable: true
    },
    dateIssued: {
        type: Date,
        default: new Date().toString()
    },

    countryStart: {
        type: Number,
        default: 0,
        required: true,
    },
    countryEnd: {
        type: Number,
        default: 0,
        required: true
    },

    area: {
        type: Number,
        default: 0
    },
    areaAtEnd: {
        type: Number,
        default: 0
    },
    areaTotal: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Alert', alertSchema);
