"use strict";

/**
 * GLAD API service
 */
class GLAD
{
    /**
     * @param {bool} logging On/off console printing of country fetching status
     */
    constructor(logging = false)
    {
        /**
         * GFW API URI: \
         * `http://production-api.globalforestwatch.org/glad-alerts`
         */
        this.api = 'http://production-api.globalforestwatch.org/glad-alerts';

        this.http = require('http');

        this.logging = logging;
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
        let Country = require('./country'),
            data = new Country();
            country = await data.getByCode(country);

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

        return area / 1000000;
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
            if (this.logging) {
                console.log(`${country}: ${alerts.errors[0].detail}`);
            }

            if (alerts.errors[0].status == 500 || alerts.errors[0].status == 404) {
                alerts = { data: { attributes: { value: 0 }}};
            }

            else {
                alerts = await this.fetchCountry(country, period);
            }
        }

        let area = this.alertsArea(alerts);

        if (this.logging) {
            console.log(`${country}: ${alerts.data.attributes.value} (${area})`);
        }

        return area;
    }

    /**
     * Fetch alerts for all countries in a given period
     * @param {string} period A period of two dates
     * @param {number} delay Number of miliseconds to wait between calls
     * @returns {number} Number of square kilometers deforestated
     */
    async getAlerts(period, delay = 400)
    {
        let alerts = 0;
        let countryList = require('country-list').getCodes();

        return new Promise((resolve, reject) => {
            countryList.forEach(async (country, index) => {
                country = await this.countryISO3(country);
    
                // Set delay to not overflow the server
                setTimeout(async () => {
                    let area = await this.getAlertsCountry(country, period);
                    
                    alerts += area;

                    if (index == countryList.length - 1) {
                        resolve(alerts);
                    } else {
                        index++;
                    }

                }, delay * (index));
            });
        });
    }
}

module.exports = GLAD;
