"use strict"

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var logSchema = new Schema({
    
    /**
     * @var {Date} date Date of memory generation
     */
    date: {
        type: Date,
        default: new Date(),
        immutable: true
    },

    /**
     * @var {Date} gladStart Date of start for the period
     */
    gladStart: {
        type: Date,
        required: true
    },

    /**
     * @var {Date} gladEnd Date of end for the period
     */
    gladEnd: {
        type: Date,
        required: true
    },

    /**
     *  @var {Object} glad Glad log for each country API response \
     * at the time the request was made
     */
    gladLog: {
        type: Object,
        default: {},
        required: false
    }
});

module.exports = mongoose.model('Log', logSchema);
