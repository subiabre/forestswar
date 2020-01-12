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

        /**
         * REST Countries API URI: \
         * `https://restcountries.eu/rest/v2/alpha`
         */
        this.restcountries = 'http://restcountries.eu/rest/v2/alpha';

        this.country(country);
    }

    /**
     * Set the mapper country code
     * @param {string} country Country ISO3 code 
     */
    country(country)
    {
        this.country = country;
        this.image = this.gadm + '/' + country + '/' + country + '.png';
    }

    /**
     * Obtain an image map from GADM and process it with replace-color module
     */
    async fetchGADM()
    {
        let replaceColor = require('replace-color');

        return replaceColor({
            image: this.image,
            colors: {
                type: 'hex',
                // Paint the sea in blue
                targetColor: '#ffffff',
                replaceColor: '#99CCFF'
            }
        })
        .then((jimp) => {
            return jimp;
        })
        .catch((error) => {
            return error;
        });
    }

    /**
     * Get area of country from REST countries
     * @param {string} country Country ISO3 code to be fetched 
     */
    async fetchCountryArea(country = this.country)
    {
        let http = require('http');
        let api = this.restcountries + '/' + country;

        return new Promise((resolve, reject) => {
            http.get(api, (REST) => {
                REST.on('data', (data) => {
                    try {
                        let country = JSON.parse(data).area;

                        resolve(country);
                    } catch (error) {
                        reject(error);
                    }
                });

                REST.on('error', (error) => {
                    console.log(`Error fetching ${api}`);
                    reject(error);
                });
            });
        });
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
     */
    async paintArea(area)
    {
        let Jimp = require('jimp');
        let map = await this.fetchGADM();
        let country = await this.kilometersToPixels();

        let paintArea = area * country.ppkm,
            land = Jimp.cssColorToHex('#D3D3D3'),
            x = 0,
            y = 0;

        // Parse image top to bottom
        while (map.bitmap.height >= y) {
            // Paint land pixels
            let pixel = map.getPixelColor(x, y);
            if (pixel == land && paintArea > 0) {
                map.setPixelColor(0x19191FFF, x, y);
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

        map.write('./map/map.png');
        return map;
    }
}

module.exports = Mapper;
