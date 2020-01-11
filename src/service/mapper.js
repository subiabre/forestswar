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
                targetColor: '#d3d3d3', // this is the color GADM colors land with
                replaceColor: '#00000000' // this is a transparency
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
     * Make a background for a map
     */
    async makeBackground()
    {
        let Jimp = require('jimp');
        let map = await this.fetchGADM();

        return new Promise((resolve, reject) => {
            new Jimp(map.bitmap.width, map.bitmap.height, '#83ff9d', (err, bg) => {
                if (err) {
                    reject(err);
                }

                resolve(bg);
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
     * Calculates the fill size for a deforestated area size
     * @param {number} area Square kilometers
     * @return {number} Fill size as percentage of the map
     */
    async calcFill(area)
    {
        let country = await this.kilometersToPixels();

        let percentage = (area * 100) / country.kilometers;

        return percentage;
    }
    
    /**
     * Make a background filling with the specified area percentage
     * @param {number} area Percentage of map area to be filled
     */
    async makeFill(area)
    {
        let Jimp = require('jimp');
        let map = await this.fetchGADM();
        let mapArea = map.bitmap.width * map.bitmap.height;
        let fillArea = (area * mapArea) / 100;
        let fillWidth = fillArea / map.bitmap.height;

        return new Promise((resolve, reject) => {
            new Jimp(fillWidth, map.bitmap.height, '#f13c3c', (err, fill) => {
                if (err) {
                    reject(err);
                }

                resolve(fill);
            });
        });
    }
}

module.exports = Mapper;
