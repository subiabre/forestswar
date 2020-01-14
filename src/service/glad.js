"use strict";

/**
 * GLAD API service
 */
class GLAD
{
    constructor()
    {
        /**
         * GFW API URI: \
         * `http://production-api.globalforestwatch.org/glad-alerts`
         */
        this.api = 'http://production-api.globalforestwatch.org/glad-alerts';

        this.countries = 'http://restcountries.eu/rest/v2/alpha'

        this.http = require('http');
    }

    /**
     * Formats dates as something GFW API can understand
     * @param {string|date} date 
     * @return {string} String date as YYYY-MM-DD
     */
    formatDate(date)
    {
        return new Date(date).toISOString().split('T')[0];
    }

    /**
     * Formats periods as something GFW API can undertsand
     * @param {string|date} start Date of period start 
     * @param {string|date} end Date of period end
     * @return {string} String to be used as period when fetching GFW API
     */
    formatPeriod(start, end = new Date())
    {
        return '?period=' + this.formatDate(start) + ',' + this.formatDate(end);
    }

    /**
     * Transform a country ISO2 code to ISO3
     * @param {string} country Country ISO2 code
     * @return {string} Country ISO3 code
     */
    async countryISO3(country)
    {
        return new Promise((resolve, reject) => {
            this.http.get(this.countries + '/' + country, (res) => {
                let country = '';

                res.on('data', (data) => {
                    country += data;
                });

                res.on('end', () => {
                    country = JSON.parse(country);

                    resolve(country.alpha3Code);
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Calculate the alerts area in square kilometers
     * @param {object} alert Alert object
     * @return {number} Number of square kilometers
     */
    alertsArea(alert)
    {
        let area = alert.data.attributes.value;
        area = area * 30 * 30;

        return Math.round(area / 1000000);
    }

    /**
     * Obtain the date of the last issued alert
     * @returns {string} Date object
     */
    async getLatest()
    {
        return new Promise((resolve, reject) => {
            let api = this.api + '/latest';
            
            this.http.get(api, (res) => {
                let alert = '';

                res.on('data', (data) => {
                    alert += data;
                });

                res.on('end', () => {
                    alert = JSON.parse(alert);
                    let date = alert.data[0].attributes.date;

                    resolve(new Date(date));
                });

                res.on('error', (error) => {
                    reject(error);
                });
            });
        });
    }

    /**
     * Fetch alerts for a given country in a given period
     * @param {string} country Country ISO3 code
     * @param {string} period A period of two dates
     * @returns {number} Number of square kilometers deforestated
     */
    async getAlertsCountry(country, period)
    {
        return new Promise((resolve, reject) => {
            let api = this.api + '/admin/' + country + period;

            this.http.get(api, async (res) => {
                let alerts = '';

                res.on('data', (data) => {
                    alerts += data;
                });

                res.on('end', async () => {
                    alerts = JSON.parse(alerts);
                    
                    if (alerts.errors) {
                        alerts = { data: { attributes: { value: 0 } } };
                    }

                    let area = this.alertsArea(alerts);
                    resolve(area);
                });
            }).on('error', () => {
                this.getAlertsCountry(country, period);
            });
        });
    }

    /**
     * Fetch alerts for all countries in a given period
     * @param {string} period A period of two dates
     * @param {number} delay Number of miliseconds to wait between calls
     * @returns {number} Number of square kilometers deforestated
     */
    async getAlerts(period, delay = 400)
    {
        return new Promise((resolve, reject) => {
            let countryList = require('country-list');
            let alerts = 0;

            countryList.getCodes().forEach(async (country, index) => {
                country = await this.countryISO3(country);
                index = index + 1;

                // Set delay to not overflow the server
                setTimeout(async () => {
                    alerts += await this.getAlertsCountry(country, period);

                    if (index >= countryList.getCodes().length) {
                        resolve(alerts);
                    }
                }, delay * (index));
            });
        });
    }
}

module.exports = GLAD;
