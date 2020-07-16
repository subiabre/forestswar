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
     * @var {Date} gladLatest Date of latest glad alert
     */
    gladLatest: {
        type: Date,
        required: true
    },

    /**
     * @var {Number} gladArea Aggregated area of deforestation for this country
     */
    gladArea: {
        type: Number,
        default: 0,
        required: true
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
     * @var {Number} area Area of deforestation
     */
    area: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Memory', memorySchema);
