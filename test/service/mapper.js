const Country = require('../../src/service/country');
const { count } = require('../../src/model/memory');

var Mapper = require('../../src/service/mapper'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: mapper', () => {
    it ('should paint the given area inside the country', async function() {
        this.timeout(10000);

        var Jimp = require('jimp');

        var mapper = new Mapper,
            andorra = await new Country('AND').getByCode(),
            image = await andorra.getMapImage(),
            area = await mapper.kilometersToPixels(400, andorra),
            map = await mapper.paintArea(image, area, '#19191F');
            

        assert.isObject(map);
        assert.exists(map.bitmap);
        assert.equal(typeof map.write, 'function');
        assert.equal(map.getPixelColor(240, 200), Jimp.cssColorToHex('#19191F'));
    });
});
