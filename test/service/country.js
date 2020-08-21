"use strict";

var Country = require('../../src/service/country'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: country', () => {
    it ('should fetch country data', async function() {
        var country = new Country(),
            country = await country.getByCode('ESP');

        assert.isObject(country);
        assert.exists(country.data.area);
        assert.exists(country.data.alpha3Code);
        assert.equal(country.data.alpha2Code, 'ES');
    });

    it ('should retrieve a map from GADM', async function() {
        this.timeout(10000);

        var country = await new Country('AND').getByCode(),
            map = await country.getMapImage();

        assert.isObject(map);
        assert.exists(map.bitmap);
        assert.equal(typeof map.write, 'function');
    });
});
