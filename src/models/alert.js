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

    country: {
        type: String,
        required: true,
        default: 'ISO'
    },
    countryRemainingArea: {
        type: Number,
        default: 0,
        required: true
    },

    area: {
        type: Number,
        default: 0
    },

    areaRemaining: {
        type: Number,
        default: 0
    },

    areaTotal: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Alert', alertSchema);
