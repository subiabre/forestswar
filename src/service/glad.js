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
        let Country = require('./country');
            country = new Country(country);
            country = await country.get();

        return country.alpha3Code;
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
     * @param {string} period A period of two date
     * @returns {object} The response object 
     */
    async fetchCountry(country, period)
    {
        return new Promise((resolve, reject) => {
            let api = this.api + '/admin/' + country + period;

            this.http.get(api, (res) => {
                let alerts = '';

                res.on('data', (data) => {
                    alerts += data;
                });

                res.on('end', () => {
                    alerts = JSON.parse(alerts);
                    
                    resolve(alerts);
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Fetch alerts for a given country in a given period, fail-safe
     * @param {string} country Country ISO3 code
     * @param {string} period A period of two dates
     * @returns {number} Number of square kilometers deforestated
     */
    async getAlertsCountry(country, period)
    {
        let alerts = await this.fetchCountry(country, period);

        if (alerts.errors) {
            if (alerts.errors[0].status == 500) {
                alerts = { data: { attributes: { value: 0 }}};
            }

            else {
                alerts = await this.fetchCountry(country, period);
            }
        }

        return this.alertsArea(alerts);
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
            let countries = countryList.getCodes().length;
            let alerts = 0;

            countryList.getCodes().forEach(async (country, index) => {
                country = await this.countryISO3(country);
                index = index + 1;

                // Set delay to not overflow the server
                setTimeout(async () => {
                    alerts += await this.getAlertsCountry(country, period);

                    this.consoleUpdate('PROCESSED: ' + index + '/' + countries + '. AREA: ' + alerts);

                    if (index > countries -1) {
                        console.log();
                        resolve(alerts);
                    }

                }, delay * (index));
            });
        });
    }

    /**
     * Update console log
     * @param {number} message Message to be updated 
     */
    consoleUpdate(message){
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(message);
    }
}

module.exports = GLAD;
