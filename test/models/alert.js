var Alert = require('../../src/models/alert'),
    chai = require('chai'),
    assert = chai.assert;

describe ('Model: alert', () => {
    it ('should have issue date of alert', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.dateIssued);
        assert.isAtLeast(
            new Date(), 
            new Date(alert.dateIssued)
        );
        done();
    });

    it ('should have date of local storage', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.dateLocal);
        assert.isAtLeast(
            new Date(),
            new Date(alert.dateLocal)
        );
        done();
    });

    it ('should have selected country code', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.country);
        done();
    });

    it ('should have country remaining area', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.countryRemainingArea);
        assert.isNumber(alert.countryRemainingArea);
        done();
    });

    it ('should have deforestated area', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.area);
        assert.isNumber(alert.area);
        done();
    });

    it ('should have have remaining deforestated area', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.areaRemaining);
        assert.isNumber(alert.areaRemaining);
        done();
    });

    it ('should have historical deforestated area', (done) => {
        var alert = new Alert();

        assert.isDefined(alert.areaTotal);
        assert.isNumber(alert.areaTotal);
        done();
    });

});
