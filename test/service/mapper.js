var Mapper = require('../../src/service/mapper'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: mapper', () => {
    it ('should retrieve a map from GADM', async function() {
        this.timeout(10000);

        var mapper = new Mapper('AND');
        var map = await mapper.fetchGADM();

        assert.isObject(map);
        assert.exists(map.bitmap);
        assert.equal(typeof map.write, 'function');
    });

    it ('should paint the given area inside the country', async function() {
        this.timeout(10000);

        var Jimp = require('jimp');

        var mapper = new Mapper('AND');
        var map = await mapper.paintArea(mapper, 400, '#19191F');

        assert.isObject(map);
        assert.exists(map.bitmap);
        assert.equal(typeof map.write, 'function');
        assert.equal(map.getPixelColor(240, 200), Jimp.cssColorToHex('#19191F'));
    });
});
