"use strict"

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var memorySchema = new Schema({
    
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
     * @var {Number} gladArea Area of deforestation for the period between gladStart and gladEnd \
     * at the time the request was made
     */
    gladArea: {
        type: Number,
        default: 0,
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
    },
    
    /**
     * @var {Number} country List index of the country
     */
    country: {
        type: Number,
        default: 0,
        required: true,
    },

    /**
     * @var {Number} area Aggregated area of deforestation
     */
    area: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Memory', memorySchema);
