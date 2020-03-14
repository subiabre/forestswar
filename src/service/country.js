"use strict";

/**
 * Country data service
 */
class Country
{
    constructor()
    {

        /**
         * REST countries API URI: \
         * `https://restcountries.eu/rest/v2/`
         */
        this.api = 'http://restcountries.eu/rest/v2/';

        this.http = require('http');
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
            this.http.get(this.api + endpoint + '/' + countryId, (res) => {

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
     * @param {string} country Country name
     * @returns {object} Country data object
     */
    async getByName(country)
    {
        return await this.get('name', country);
    }

    /**
     * Return a country data as an object by ISO code
     * @param {string} country Country code
     * @returns {object} Country data object
     */
    async getByCode(country)
    {
        return await this.get('alpha', country);
    }
}

module.exports = Country;
