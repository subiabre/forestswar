var Mapper = require('../../src/service/mapper'),
    chai = require('chai'),
    assert = chai.assert;

describe('Service: mapper', () => {
    it ('should retrieve a map from GADM', async () => {
        var mapper = new Mapper();
        var map = await mapper.getMapOf('AND');

        assert.isObject(map);
    });

    it ('should transparent the country shape', async () => {
        var mapper = new Mapper();
        var map = await mapper.getMapOf('AND');
        var newMap = mapper.emptyInline(map);

        assert.isObject(newMap);
    });

    it ('should read image x and y length', async () => {
        var mapper = new Mapper();
        var map = await mapper.getMapOf('AND');
        var dimensions = mapper.getDimensions(map);

        assert.isObject(dimensions);
        assert.isNumber(dimensions.x);
        assert.isNumber(dimensions.y);
    });

    it ('should fill a map in a responsize way', async () => {
        var mapper = new Mapper();
        var map = await mapper.getMapOf('AND');
        var filledMap = mapper.fillMap(map, 234);
        var image = await mapper.saveToPng(filledMap);

        assert.isObject(filledMap);
        assert.exists(image);
    });
});
