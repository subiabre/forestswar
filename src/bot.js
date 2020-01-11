/**
 * Deforestation
 * 
 * A bot to help visualize forest loss accross the globe.
 * In loving memory of my friend @wishiwasrubin
 * 
 * @author Facundo Subiabre
 * @license MIT
 * @version 1.0
 * @repository https://gitlab.com/subiabre/deforestation
 */
class Deforestation
{
    /**
     * Deforestation bot.
     * 
     * A bot to help visualize forest loss accross the globe.
     */
    constructor()
    {
        this.loadEnv();

        this.loadServices();
    }

    /**
     * Sends (or not) a message to `console.log()`
     * @param {string} message Message to be displayed 
     */
    console(message)
    {
        this.consoleLog.push({
            message: message,
            date: new Date()
        });

        if (this.env.logging) {
            console.log(message);
        }
    }

    /**
     * Obtain the bot routine log
     * @return array
     */
    getLog()
    {
        return {
            statusDate: new Date(),
            botLog: this.consoleLog,
        }
    }

    /**
     * Loads environment settings
     */
    loadEnv()
    {
        var dotenv = require('dotenv');
        dotenv.config();

        // Store env vars
        this.env = {
            twitter: {
                on: process.env.TWITTER,
                consumerKey: process.env.TWITTER_CONSUMER_KEY,
                consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
                accessTokenKey: process.env.TWITTER_ACCESS_TOKEN_KEY,
                accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
            },

            database: process.env.DATABASE_URL,

            logging: process.env.LOGGING,

            delay: process.env.DELAY_MS || 300,

            startDate: process.env.START_DATE
        }

        // Start empty log
        this.consoleLog = new Array();

        this.console('BOT ENVIRONMENT SETUP');
    }

    /**
     * Loads bot services
     */
    loadServices()
    {
        this.mongoose = require('mongoose');
        this.mongoose.connect(
            this.env.database,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );

        let Twitter = require('twitter');
        this.twitter = new Twitter({
            consumer_key: this.env.twitter.consumerKey,
            consumer_secret: this.env.twitter.consumerSecret,
            access_token_key: this.env.twitter.accessTokenKey,
            access_token_secret: this.env.twitter.accessTokenSecret
        });

        this.http = require('http');

        this.countries = require('country-list');
        this.countryToISO3 = require('country-iso-2-to-3');

        /**
         * Global Forests Watch API URI: \
         * `http://production-api.globalforestwatch.org/glad-alerts`
         */
        this.gfw = 'http://production-api.globalforestwatch.org/glad-alerts';

        /**
         * REST Countries API URI: \
         * `https://restcountries.eu/rest/v2/alpha/col`
         */
        this.restcountries = 'http://restcountries.eu/rest/v2/alpha';

        this.console('BOT SERVICES SETUP');
    }
    
    /**
     * Formats dates in a way that GFW API can understand
     * @param {string} date Date string in any format
     * @return {string} A string date
     */
    formatDate(date)
    {
        return new Date(date).toISOString().split('T')[0];
    }

    /**
     * Formats a period of two dates that GFW API can understand
     * @param {string} date 
     * @return {string} A string period dates between given date and current date
     */
    formatPeriod(date)
    {
        return '?period=' + this.formatDate(date) + ',' + this.formatDate(new Date().getTime());
    }

    /**
     * Runs the sequence routine of the bot
     */
    async routine()
    {
        // Recall last alert in database
        let fromMemory = await this.fetchMemory();
        this.fromMemoryDate = this.formatDate(fromMemory.dateIssued);
        this.console('LAST ALERT IS: ' + this.fromMemoryDate + ' (LOCAL AT ' + this.formatDate(fromMemory.dateLocal) + ')');

        // Fetch last alert date
        this.fromApiDate = await this.fetchLatest();
        this.console('NEW ALERT IS: ' + this.fromApiDate);

        // Compare alerts
        if (this.compareDates(this.fromMemoryDate, this.fromApiDate)) {
            // Retrieve accumulated alerts data
            this.console('DATABASE IS OUTDATED, FETCHING NEW ALERTS...');
            let alerts = await this.fetchAlerts(this.formatPeriod(this.fromMemoryDate));

            // Calc total area lost
            this.console('STORING RESULT IN DATABASE');
            let alert = await this.newAlert(alerts.area, fromMemory);

            // Make map
            this.console('STARTING MAP SERVICE');
            let alertArea = alert.countryArea - alert.countryRemainingArea;
            let map = await this.makeMap(alert.country, alertArea);

            // Update Twitter
        }

        else {
            this.console('NO NEW UPDATES TO FETCH');
        }

        this.console('BOT ROUTINE FINISHED.');
    }

    /**
     * Obtain the latest alert stored in memory
     * @return object Promise
     */
    async fetchMemory()
    {
        let fakeAlert = await this.fakeAlert();

        return new Promise((resolve, reject) => {
            let Alert = require('./models/alert');

            Alert.findOne({}, {}, { sort: { 'dateIssued': -1 } }, (error, alert) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!alert) {
                    alert = fakeAlert;
                    this.persistAlert(alert);
                }

                resolve(alert);
            });
        });
    }

    /**
     * Returns an alert object that actually doesn't exist to keep the routine going
     */
    async fakeAlert()
    {
        let Alert = require('./models/alert');
        let dateIssued = this.env.startDate || await this.fetchLatest();
        let country = this.countryToISO3(this.countries.getCodes()[0]);
        let countryArea = await this.fetchCountryArea(country);
        
        let alert = new Alert({
            dateIssued: this.formatDate(dateIssued),
            dateLocal: this.formatDate(new Date().toString()),
            country: country,
            countryRemainingArea: countryArea
        });

        return new Promise((resolve, reject) => {
            resolve(alert);
        });
    }

    /**
     * Save an alert record
     * @param {object} data Object data of the alert model
     */
    async persistAlert(data)
    {
        let Alert = require('./models/alert');
        let alert = new Alert(data);

        return alert
            .save()
            .then((alert) => {
                return alert
            })
            .catch((error) => {
                this.console(error);
                return error;
            });
    }

    /**
     * Generates a new alert entity
     * @param {number} area Total area deforestated
     * @param {object} fromMemory Previous alert entity in memory
     */
    async newAlert(area, fromMemory)
    {
        let countryArea = await this.fetchCountryArea(fromMemory.country);
        let countryRemainingArea = countryArea - area - fromMemory.areaRemaining;

        if (countryRemainingArea <= 0) {
            var areaRemaining = Math.abs(countryRemainingArea); 
        }

        else {
            var areaRemaining = 0;
        }

        let alert = {
            dateIssued: this.fromApiDate,
            country: fromMemory.country,
            countryRemainingArea: countryArea - area,
            area: area,
            areaRemaining: areaRemaining,
            areaTotal: fromMemory.area + area
        }

        return this.persistAlert(alert);
    }

    /**
     * Fetch the API to obtain the latest alert issued
     * @return object Promise
     */
    async fetchLatest()
    {
        return new Promise((resolve, reject) => {
            this.http.get(this.gfw + '/latest', (GLAD) => {
                GLAD.on('data', (data) => {
                    try {
                        let alert = JSON.parse(data).data[0].attributes.date;

                        resolve(alert);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        });
    }

    /**
     * Get area of country from REST countries
     * @param {string} country Country ISO3 code to be fetched 
     */
    async fetchCountryArea(country)
    {
        return new Promise((resolve, reject) => {
            this.http.get(this.restcountries + '/' + country, (REST) => {
                REST.on('data', (data) => {
                    try {
                        let country = JSON.parse(data).area;

                        resolve(country);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        });
    }

    /**
     * Checks if two dates are different
     * @param {string} date1 
     * @param {string} date2 
     */
    compareDates(date1, date2)
    {
        date1 = new Date(date1).getTime();
        date2 = new Date(date2).getTime();

        if (date1 < date2) {
            return true;
        }

        return false;
    }

    /**
     * Fetch the API for all the countries in any given time period
     * @param {string} period Dates period to limit the API calls
     */
    async fetchAlerts(period)
    {
        return new Promise((resolve, reject) => {
            let area = 0;
            let errors = 0;
            let start = new Date().getTime();

            this.countries.getCodes().forEach((country, index) => {
                country = this.countryToISO3(country);
                let delay = this.env.delay * (index + 1);

                // Add delay between calls to not saturate server
                setTimeout(() => {
                    this.http.get(this.gfw + '/admin/' + country + period, (GLAD) => {
                        let alert;
    
                        GLAD.on('data', (data) => {
                            try {
                                alert = JSON.parse(data).data;
                            } catch (error) {
                                alert = null;
                                errors++;
                            }
                        });
    
                        GLAD.on('end', () => {
                            if (alert && alert.attributes.value > 0) {
                                // Each alert value represents a pixel of 30m x 30m
                                area += alert.attributes.value*30*30;
                            }
    
                            if (index >= this.countries.getCodes().length - 1) {
                                let time = (new Date().getTime() - start) / 1000;
                                let calls = index + 1;
                                
                                this.console('FETCHED ' + calls + ' COUNTRIES IN ' + time + 's');
                                this.console('  ERRORS: ' + errors);
                                this.console('  DELAY TIME: ' + (delay / 1000) + 's (' + this.env.delay + 'ms)');
                                this.console('  LOST AREA IS: ' + this.calcKms(area) + 'km2');
    
                                resolve(area);
                            }    
                        });
                    });
                }, delay);
            });
        });
    }

    /**
     * Calc the size of an area from square metres to kilometres
     * @param {number} metres Square metres area 
     * @return {number} Rounded up square kms
     */
    calcKms(metres)
    {
        return Math.round(metres / 1000000);
    }

    /**
     * Make maps illustrating the deforestated area
     * @param {string} country Country ISO3 code
     * @param {*} area Country deforestated area
     */
    async makeMap(country, area)
    {
        let Mapper = require('./service/mapper');
        let Jimp = require('jimp');
        let map = new Mapper(country);

        let fillSize = await map.calcFill(area);

        let background = await map.makeBackground();
        let fill = await map.makeFill(fillSize);
        let top = await map.fetchGADM();
        
        top.write('./map/top.png');
        Jimp.read('./map/top.png')
            .then((map) => {
                background.composite(fill, 0, 0);
                background.write('./map/fill.png');
                background.composite(map, 0, 0);
                background.write('./map/map.png');

                console.log('DREW MAP OF ' + country);
                return background;
            })
            .catch((error) => {
                return error;
            });
    }

}

module.exports = Deforestation;
