"use strict";

var Country = require('../../src/service/country'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: country', () => {
    it ('should fetch country data', async function() {
        var country = new Country('ESP');

        assert.isObject(country);
        assert.exists(country.area);
        assert.exists(country.alpha3Code);
        assert.equal(country.alpha2Code, 'ES');
    });
});
