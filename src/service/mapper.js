"use strict"

/**
 * Mapper service
 */
class Mapper
{
    /**
     * Use Mapper to make image maps
     * @param {string} country Country ISO3 code
     */
    constructor(country)
    {
        /**
         * GADM API URI: \
         * `https://gadm.org/img/480/gadm`
         */
        this.gadm = 'https://gadm.org/img/480/gadm';

        this.setCountry(country);
    }

    /**
     * Set the mapper country code
     * @param {string} country Country ISO3 code 
     */
    setCountry(country)
    {
        this.country = country;
        this.image = this.gadm + '/' + country + '/' + country + '.png';
    }

    /**
     * Obtain an image map from GADM
     */
    async fetchGADM()
    {
        let Jimp = require('jimp');

        return Jimp.read(this.image)
            .then(map => {
                return map;
            })
            .catch(err => {
                console.log(err);
            });
    }

    /**
     * Get area of country from REST countries
     * @param {string} country Country ISO3 code to be fetched 
     */
    async fetchCountryArea(country = this.country)
    {
        let Country = require('./country');
            country = new Country(country);
            country = await country.get();

        return country.area;
    }

    /**
     * FInd the relation of current map country area to pixels
     * @return {number} Square kilometers per pixel in map
     */
    async kilometersToPixels()
    {
        let countPixels = require('count-pixels');
        
        let pixelCount = await countPixels(this.image);
        let countryPixels = pixelCount['#d3d3d3'];
        let countryKilometers = await this.fetchCountryArea();

        return new Promise((resolve, reject) => {
            resolve({
                pixels: countryPixels,
                kilometers: countryKilometers,
                ppkm:  countryPixels / countryKilometers
            });
        });
    }

    /**
     * Replace the pixels on the map with deforestaded pixels
     * @param {number} area Deforestated area
     * @param {hex} color Deforestated area color
     */
    async paintArea(area, color)
    {
        let Jimp = require('jimp');
        let map = await this.fetchGADM();
        let country = await this.kilometersToPixels();

        let paintArea = area * country.ppkm,
            land = Jimp.cssColorToHex('#D3D3D3'),
            hexCode = Jimp.cssColorToHex(color),
            x = 0,
            y = 0;

        // Parse image top to bottom
        while (map.bitmap.height >= y) {
            // Paint land pixels
            let pixel = map.getPixelColor(x, y);
            if (pixel == land && paintArea > 0) {
                map.setPixelColor(hexCode, x, y);
                paintArea -= 1;
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
