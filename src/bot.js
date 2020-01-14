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

            delay: process.env.DELAY_MS || 400,

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

        let GLAD = require('./service/glad'),
            Mapper = require('./service/mapper');

        /**
         * GLAD service internal instance
         */
        this.glad = new GLAD();

        /**
         * Mapper service internal instance
         */
        this.map = new Mapper();
        

        /**
         * REST Countries API URI: \
         * `https://restcountries.eu/rest/v2/alpha/col`
         */
        this.restcountries = 'http://restcountries.eu/rest/v2/alpha';

        this.console('BOT SERVICES SETUP');
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
     * Runs the sequence routine of the bot
     */
    async routine()
    {
        // Recall last alert in database
        let fromMemory = await this.fetchMemory(),
            dateMemory = this.glad.formatDate(fromMemory.dateIssued);
        this.console('LAST ALERT DATE IS: ' + dateMemory + ' (LOCAL AT ' + this.glad.formatDate(fromMemory.dateLocal) + ')');
        
        // Fetch last alert date
        let dateLatest = await this.glad.getLatest();
        this.console('NEW ALERT DATE IS: ' + this.glad.formatDate(dateLatest));

        // Compare alerts
        if (this.compareDates(dateMemory, dateLatest)) {
            // Retrieve accumulated alerts data
            this.console('FETCHING NEW ALERTS SINCE ' + dateMemory);
            
            let period = this.glad.formatPeriod(dateMemory),
                alerts = await this.glad.getAlerts(period, this.env.delay);

            this.console('AREA RESULT IS: ' + alerts);

            // Save result to database
            this.console('STORING RESULT IN DATABASE');
            
            let alert = await this.newAlert(alerts, fromMemory, dateLatest);

            // Make maps
            this.console('MAP SERVICE STARTED');

            let maps = new Array();
            while (alert.countryStart <= alert.countryEnd) {
                // If it's the very first map, ignore the area at end
                if (alert.countryStart == 0) {
                    alert.areaAtEnd = 0;
                }

                let paint = alert.areaAtEnd + alert.area;
                
                let country = this.countries.getCodes()[alert.countryStart];
                    country = this.countryISO3(country);

                this.map.setCountry(country);

                let map = await this.map.paintArea(paint);
                map.write('./map/' + country + '.png');
                maps.push({
                    map: map,
                    alert: alert
                });
                
                alert.areaAtEnd = 0;
                alert.area -= await this.map.fetchCountryArea(country);
                alert.countryStart++;
            }

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
                    alert.save();
                }

                resolve(alert);
            });
        });
    }

    /**
     * Returns an alert object that actually doesn't exist to keep the routine going
     */
    fakeAlert()
    {
        let Alert = require('./models/alert');
        let dateIssued = this.env.startDate;
        
        return new Alert({
            dateLocal: this.glad.formatDate(new Date()),
            dateIssued: this.glad.formatDate(dateIssued)
        });

    }

    /**
     * Generates a new alert entity
     * @param {number} area Total area deforestated
     * @param {object} memory Previous alert entity in memory
     * @param {object|string} dateIssued Issue date of alert
     */
    async newAlert(area, memory, dateIssued)
    {
        memory.dateLocal = this.glad.formatDate(new Date());
        memory.dateIssued = this.glad.formatDate(dateIssued);

        memory.area = area;
        memory.areaTotal += area;

        let countries = 0;
        while (area > 0) {
            let country = this.countries.getCodes()[memory.countryEnd + countries];
                country = await this.map.fetchCountryArea(country);

            if (area - country > 0) {
                countries += 1;
            }

            memory.areaAtEnd = area;
            area -= country;
        }

        memory.countryStart = memory.countryEnd;
        memory.countryEnd = memory.countryStart + countries;

        return memory
            .save()
            .then((alert) => {
                return alert;
            })
            .catch((error) => {
                return error;
            });
    }

    /**
     * Checks if two dates are different
     * @param {object|string} date1 
     * @param {object|string} date2 
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
}

module.exports = Deforestation;
