"use strict";

var GLAD = require('../../src/service/glad'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: GLAD', () => {
    it ('should format dates', (done) => {
        var test = new Date('2019-12-31');
        var glad = new GLAD();
        var date = glad.formatDate(test);
        var period = glad.formatPeriod('2019-01-01', test);

        assert.equal(date, '2019-12-31');
        assert.equal(period, '?period=2019-01-01,2019-12-31');
    });

    it ('should fetch the latest alert from GLAD', async () => {
        var glad = new GLAD();
        var lastAlert = glad.getLatest();

        assert.instanceOf(lastAlert, new Date());
    });

    it ('should fetch alerts by country', async () => {
        var glad = new GLAD();
        var period = glad.formatPeriod('2019-01-01', '2019-12-31');
        var alerts = glad.alertsCountry('ESP', period);
        
        assert.isNumber(alerts);
    });

    it ('should fetch alerts from all countries', async () => {
        var glad = new GLAD();
        var period = glad.formatPeriod('2019-01-01', '2019-12-31');
        var alerts = glad.alerts(period);

        assert.isNumber(alerts);
    });
});
