"use strict";

/**
 * Country data service
 */
class Country
{
    /**
     * Get data from a country
     * @param {string} country Country ISO2 or ISO3 code
     */
    constructor(country)
    {
        this.country = country;

        /**
         * REST countries API URI: \
         * `https://restcountries.eu/rest/v2/alpha`
         */
        this.api = 'http://restcountries.eu/rest/v2/alpha';

        this.http = require('http');
    }

    /**
     * Return a country data as an object
     * @returns {object} Country data object
     */
    async get()
    {
        return new Promise((resolve, reject) => {
            this.http.get(this.api + '/' + this.country, (res) => {
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
}

module.exports = Country;
