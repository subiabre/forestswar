const 
    Country = require('./service/country'),
    Memory = require('./model/memory'),
    Twitter = require('twitter'),
    GLAD = require('./service/glad'),
    Mapper = require('./service/mapper');

/**
 * A bot to help visualize forest loss accross the globe.
 * In loving memory of my friend @wishiwasrubin
 * 
 * @author Facundo Subiabre (subiabre at gmail dot com)
 * @license MIT
 * @version 2.2
 * @repository https://gitlab.com/subiabre/deforestation
 */
class Bot
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
            console.log(this.consoleLog[this.consoleLog.length - 1]);
        }
    }

    /**
     * Obtain the bot routine log
     * @return {JSON}
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
            loggingGlad: process.env.LOGGING_GLAD,

            delay: process.env.DELAY_MS || 400,

            startDate: process.env.START_DATE,

            deforestatedColor: process.env.DEFORESTATED_COLOR
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
            ).catch(error => {
                this.console(error);
                return;
            });
        }
        
        this.twitter = new Twitter({
            consumer_key: this.env.twitter.consumerKey,
            consumer_secret: this.env.twitter.consumerSecret,
            access_token_key: this.env.twitter.accessTokenKey,
            access_token_secret: this.env.twitter.accessTokenSecret
        });

        this.http = require('http');

        this.countries = require('country-list');

        let fs = require('fs'),
        fileList = fs.readFileSync('src/list.json');
    
        /**
         * Countries list
         */
        this.list = JSON.parse(fileList);

        /**
         * GLAD service internal instance
         */
        this.glad = new GLAD();

        this.glad.logging = this.env.loggingGlad;

        /**
         * Mapper service internal instance
         */
        this.map = new Mapper();

        this.console('BOT SERVICES SETUP');
    }

    /**
     * Runs the sequence routine of the bot
     */
    async routine()
    {
        this.console('BOT ROUTINE STARTED.');

        if (!this.env.database) {
            this.console('DATABASE IS REQUIRED TO INIT THE ROUTINE.');
            
            return;
        }
        
        // Fetch memory
        let memory = await this.getMemory();
        this.console('MEMORY READ: OK.');

        // Prepare GLAD period
        let gladDate = new Date().setDate(new Date().getDate() - 7),
            gladDateString = this.toLocaleDateString(gladDate);

        // Fetch GLAD
        this.console('FETCHING FROM GLAD API.');
        this.console(`DATE IS: ${gladDateString}`);
        
        let gladPeriod = this.glad.formatPeriod(gladDate, gladDate),
            gladArea = await this.glad.getAlerts(gladPeriod, this.env.delay),
            gladAreaString = this.toLocaleAreaString(gladArea);
        this.console(`AREA IS: ${gladArea}`);

        // Exit on no deforestated area for this period
        if (gladArea < 1) {
            this.console('NO NEW DEFORESTATION. EXITING ROUTINE.');

            return;
        }

        // Fetch countries
        let countriesData = new Country,
            countryList = this.list[memory.country],
            country = await countriesData.getByCode(countryList.code);
        this.console(`COUNTRY IS: ${countryList.name}.`);

        // Calc aggregated area of deforestation
        let totalArea = gladArea + memory.area,
            totalAreaString = this.toLocaleAreaString(totalArea);

        // Calc difference between country forestal area and new deforestated area
        let remainingArea = countryList.area - totalArea,
            remainingAreaString = this.toLocaleAreaString(remainingArea);

        // Get deforestated area in comparison to country forest area
        let ratio = totalArea * 100 / countryList.area,
            deforestationArea = ratio * country.area / 100;
        
        // Get map with deforestated area
        let map = await this.map.setCountry(country.alpha3Code);
            map = await map.paintArea(deforestationArea, this.env.deforestatedColor);
        this.console('GENERATED MAP.');
        
        // Write message
        var message = `${gladAreaString} deforestated globally in ${gladDateString}, ${totalAreaString} in total against #${countryList.name}. ${remainingAreaString} remaining. #deforestation`;

        // Country is deforestated
        if (remainingArea < 0) {
            // Move country memory pointer to the next one
            memory.country += 1;
            // Reset aggregated area
            totalArea = 0;

            let countries = this.list.length - memory.country;
            message = `${totalAreaString} deforestated, #${countryList.name} has been deforestated. ${countries} countries remaining. #deforestation`;
        }

        this.console(message);

        await this.updateTwitter(map, message);
        
        let newMemory = new Memory({
            gladStart: gladDate,
            gladEnd: gladDate,
            gladArea: gladArea,
            country: memory.country,
            area: totalArea,
        });

        newMemory.save();

        this.console('BOT ROUTINE FINISHED.');
    }
    
    /**
     * Tranform a Date object into a localised string
     * @param {Date} date Date object
     */
    toLocaleDateString(date)
    {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Transform an area number into a localised string
     * @param {Number} area 
     */
    toLocaleAreaString(area)
    {
        return Math.round(area).toLocaleString() + 'km²';
    }

    /**
     * Obtain the last memory record
     * @returns {object} Mongoose promise
     */
    getMemory()
    {
        return new Promise((resolve, reject) => {
            let sorting = { sort: { '_id': -1 } };

            Memory.findOne({}, {}, sorting, (error, memory) => {
                if (error) {
                    reject(error);
                }

                if (!memory) {
                    memory = new Memory({
                        gladStart: new Date(this.env.startDate),
                        gladEnd: new Date,
                        gladArea: 0,
                        country: 0,
                        area: 0,
                    });

                    memory.save();
                    resolve(memory);
                }

                resolve(memory);
            });
        });
    }
    
    /**
     * Posts to twitter
     * @param {object} map Mapper map object
     * @param {string} message Message to be published
     */
    async updateTwitter(map, message)
    {
        let image = await map.getBufferAsync('image/jpeg'),
            params = {media: image};

        if (this.env.twitter.on) {
            this.twitter.post('media/upload', params, (err, data, res) => {
                if (err) {
                    this.console(err);
                    return;
                }
    
                params = {status: message, media_ids: data.media_id_string};
                this.twitter.post('statuses/update', params, (err, data, res) => {
                    if (err) {
                        this.console(err);
                        return;
                    }
    
                    this.console('TWITTER FEED UPDATED.');
                });
            });
        }
    }
}

module.exports = new Bot;
