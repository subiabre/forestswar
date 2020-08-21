"use strict";

/**
 * REST countries API URI: \
 * `https://restcountries.eu/rest/v2/`
 */
const API = 'http://restcountries.eu/rest/v2/';

/**
 * GADM URI: \
 * `https://gadm.org/img/480/gadm/`
 */
const GADM = 'https://gadm.org/img/480/gadm/';

const Jimp = require('jimp');
const http = require('http');
const { map } = require('../bot');

/**
 * Country data service
 */
class Country
{
    /**
     * Get a country data
     * @param {String} code Country ISO code or name
     */
    constructor(code)
    {
        this.country = code;
    }

    /**
     * Return a country data as an object
     * @param {string} method REST API endpoint
     * @param {string} countryId Country identifier
     * @returns {object} Country data object
     */
    async get(endpoint, countryId)
    {
        return new Promise((resolve, reject) => {
            http.get(API + endpoint + '/' + countryId, (res) => {
                
                let country = '';

                res.on('data', (data) => {
                    country += data;
                });

                res.on('end', () => {
                    country = JSON.parse(country);

                    resolve(country);
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Return a country data as an object by common name
     * @param {String} country Country name
     * @returns {Country}
     */
    async getByName(country = false)
    {
        if (country) this.country = country;

        this.data = await this.get('name', this.country)[0];

        return this;
    }

    /**
     * Return a country data as an object by ISO code
     * @param {String} country Country code
     * @returns {Country} 
     */
    async getByCode(country = false)
    {
        if (country) this.country = country;

        this.data = await this.get('alpha', this.country);

        return this;
    }

    /**
     * Get this country map image
     * @returns {Jimp}
     */
    async getMapImage()
    {
        let country = this.data.alpha3Code,
            mapUri = GADM + country + '/' + country + '.png';

        return Jimp.read(mapUri)
            .then(map => {
                return map;
            })
            .catch(err => {
                console.log(err);
            });
    }
}

module.exports = Country;
