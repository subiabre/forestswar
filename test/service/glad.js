"use strict";

var GLAD = require('../../src/service/glad'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: GLAD', () => {
    it ('should format dates', async function() {
        this.timeout(10000);

        var test = new Date('2019-12-31');
        var glad = new GLAD();
        var date = glad.formatDate(test);
        var period = glad.formatPeriod('2019-01-01', test);

        assert.equal(date, '2019-12-31');
        assert.equal(period, '?period=2019-01-01,2019-12-31');
    });

    it ('should fetch the latest alert from GLAD', async function() {
        this.timeout(10000);

        var glad = new GLAD();
        var lastAlert = await glad.getLatest();

        assert.instanceOf(lastAlert, Date);
    });

    it ('should fetch alerts by country', async function() {
        this.timeout(10000);
        
        var glad = new GLAD();
        var period = glad.formatPeriod('2019-01-01', '2019-12-31');
        var alerts = await glad.getAlertsCountry('ESP', period);
        
        assert.isNumber(alerts);
    });

    it ('should return 0 on countries out of API reach', async function() {
        var glad = new GLAD();
        var period = glad.formatPeriod('2019-01-01', '2019-12-31');
        var alerts = await glad.getAlertsCountry('VAT', period);

        assert.isNumber(alerts);
        assert.equal(alerts, 0);
    })
});
