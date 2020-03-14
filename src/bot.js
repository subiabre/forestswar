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
            "status": {
                "date": new Date(),
                "log": this.consoleLog,
            }
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

            database: process.env.DATABASE,
            databaseUrl: process.env.DATABASE_URL,

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
        if (this.env.database) {
            this.mongoose = require('mongoose');
            this.mongoose.connect(
                this.env.databaseUrl,
                {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                }
            );
        }
        
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

        this.console('BOT SERVICES SETUP');
    }
    
    /**
     * Transform a country ISO2 code to ISO3
     * @param {string} country Country ISO2 code
     * @return {string} Country ISO3 code
     */
    async countryISO3(country)
    {
        let Country = require('./service/country');
            country = new Country(Country);
            country = await country.get();

        return country.alpha3Code;
    }

    /**
     * Runs the sequence routine of the bot
     */
    async routine()
    {
        // Fetch memory file
        
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
