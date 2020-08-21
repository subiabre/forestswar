"use strict"

const pixelCounter = require('count-pixels');

const Jimp = require('jimp');
const Country = require('./country');
const { count } = require('../model/memory');


/**
 * Mapper service
 */
class Mapper
{
    /**
     * Calc the ratio of land to pixels in a map image
     * @param {Number} area Area in kilometers to calculate in pixels
     * @param {Country} country Country object
     * @param {String} landColor Color in map that represents land
     * @return {Number} Number of pixels that represent the area in the map
     */
    async kilometersToPixels(area, country, landColor = '#d3d3d3')
    {
        let image = country.getMapUrl(),
            pixelsTotal = await pixelCounter(image),
            pixelsCountry = pixelsTotal[landColor],
            ratio = pixelsCountry / country.data.area;

        return area * ratio;
    }

    /**
     * Replace the pixels on the map with deforestaded pixels
     * @param {Jimp} map Map image
     * @param {Number} area Area to paint, in pixels
     * @param {String} color Color to paint area with
     * @param {String} landColor Color in map to be replaced
     * @returns {Jimp}
     */
    async paintArea(map, area, color = '#f60b2a', landColor = '#D3D3D3')
    {
        let landCode = Jimp.cssColorToHex(landColor),
            hexCode = Jimp.cssColorToHex(color),
            x = 0,
            y = 0;

        // Parse image top to bottom
        while (map.bitmap.height >= y) {
            let pixel = map.getPixelColor(x, y);

            // Paint land pixels
            if (pixel == landCode && area > 0) {
                map.setPixelColor(hexCode, x, y);
                area -= 1;
            }

            // Move to the next column
            if (map.bitmap.height == y && map.bitmap.width > x) {
                x++;
                y = 0;
            // or to the next pixel
            } else {
                y++;
            }
        }

        return map;
    }
}

module.exports = Mapper;
