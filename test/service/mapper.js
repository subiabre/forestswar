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
    });

    it('should generate a background the same size the map', async function() {
        this.timeout(10000);

        var mapper = new Mapper('AND');
        var bg = await mapper.makeBackground();

        assert.isObject(bg);
        assert.exists(bg.bitmap);
        assert.equal(bg.bitmap.height, 393);
        assert.equal(bg.bitmap.width, 480);
    });

    it ('should generate a fill with the specified area', async function() {
        this.timeout(10000);

        var mapper = new Mapper('AND');
        var fill = await mapper.makeFill(50);

        assert.isObject(fill);
        assert.exists(fill.bitmap);
        assert.equal(fill.bitmap.height, 393);
        assert.equal(fill.bitmap.width, 240);
    });
});
