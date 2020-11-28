# Forests War Bot
A bot to help visualize tree cover loss across the world.

![logo_300](https://user-images.githubusercontent.com/61125897/76841080-8eb67180-6838-11ea-8173-62c5ef5ce0b0.png)

This package contains the application that runs and serves the Twitter feed at twitter.com/[@ForestsWar](https://twitter.com/ForestsWar). Everyday at 19:00 UTC this app is run as described in `bot.routine()`.

1. [About](#About)
2. [Usage](#Usage)
3. [Setup](#Setup)
4. [Support](#Support)
5. [Concerns](#Concerns-about-accuracy-and-processing-of-data)

## About
I created this bot because I found it hard to visualize just how much area is deforestated in comparisons like "*1 football pitch per minute*". Inspired by a friend's [one](https://gitlab.com/wishiwasrubin/fwbot) and someone else's [bot](https://twitter.com/WorldWarBot).

This bot fetches data from [Global Forests Watch](https://www.globalforestwatch.org/) listening for deforestation in every country in the API in a given date, then the aggregated lost area is compared against the forest area of a country from a [list](https://en.wikipedia.org/wiki/List_of_countries_by_forest_area) of 192 countries.

To make the comparisons easy to understand, the bot draws a map using images from [GADM](https://gadm.org/). These maps are a **pixel exact** representation of the deforestated area against the forest area from that country.

When the data is obtained and the map is drawn, a new status update is sent to [Twitter](https://twitter.com/ForestWar).

## Usage
Before working with this package make sure [Node.js](https://nodejs.org/en/) is installed in your system.
```bash
node -v
```

This package contains some services that could be of great utility for independent researchers and developers, because of that, services are completely decoupled from the bot itself and can be used as standalone packages.

All code is well documented and commented, so it shouldn't be a hassle to work with them.

```bash
git clone https://github.com/subiabre/forestswar
cd forestswar
npm install
```

Consider the following examples:

1. Generate a map painting 200 square kilometers in Andorra in blue.
```js
const Mapper = require('./src/service/mappper');
const Country = require('./src/service/country');

const mapper = new Mapper();
const andorra = await new Country('AND').getByCode();

let map = await andorra.getMapImage(),
    area = await mapper.kilometersToPixels(200, andorra)
    image = await mapper.paintArea(map, area, '#0000ff');
        
image.write('map/AND.png');
```

2. Obtaining the deforestation for 2015.
```js
const GLAD = require('./src/service/glad');
const api = new GLAD();

let period = api.formatPeriod('2015-01-01', '2015-12-31'),
    area = await api.getAlerts(period);

console.log(area);
```

## Setup
In order to get the bot ready and working you'll need a [MongoDB](https://www.mongodb.com/) instance.

Copy the `.env.example`:

```bash
cp .env.example .env
```
Then add the necessary parameters.

### .env
`TWITTER*` vars will switch the Twitter behaviour of the bot. You can get your Twitter keys in the [developer center](https://developer.twitter.com/en). Not necessary for the bot to start the routine but necessary for the bot to finish the routine.
`DATABASE*` vars will switch the Database behaviour of the bot. Necessary to start the routine.
`LOGGING*` vars will turn off/on the usage of logging of the bot, not necessary to complete the routine.

`DELAY_MS` will make the bot wait for as much milliseconds you set between requests to the GLAD API. In previous releases a long enough wait was critical to reduce GLAD data loss. Now it's been pretty safe to leave this number at 220. Keep in mind that you will be throwing hundreds of requests to the API so be kind to their servers.

`DELAYS_DAYS` will make the bot look for deforestation happened in the day as many days behind the current date as the number you put here. It can be used to perform [bulk updates](https://gist.github.com/subiabre/81ac8fd3ebb79cf4a877c8426d41d3aa) but actually is used as a safe mechanism to avoid dealing with added data to the GLAD API after the bot performs its routine. Usually a week is fine.

### Cron
Now to make this package actually a full bot you need to have it run automatically.

In linux environments a crontab will be fine, but whatever it is that you use to schedule daily runs of the bot, make sure it runs the following:

```bash
node path/to/bot/index.js
```

### Troubleshooting
You can tell if any of the services the bot relies on is down by running the tests:
```bash
npm test
```

Sometimes it could be one of the tests gets timed out without necessarily being because the service is down, but it definitely could be a signal.

You also have detailed, country by country logging of the GLAD API in the mongo instance.

```bash
# get the latest GLAD log
mongo
use <nameOfTheDatabase>
db.logs.find().sort({_id:-1}).limit(1);
```

## Support
If you think this project is interesting, please give it a follow on Twitter and a star on GitHub.

If you think this project is important, please tell your friends and family about it.

If you think this project could be better, Issues and Pull Requests are open.

### Concerns about accuracy and processing of data:
The following are some notes on this project's data usage with explanations about why they occur and how does this project attempt to fix them.

#### Data changes in the same periods

Due to unknown causes the GFW API presents frequent and irregular data changes, showing different ammounts of data loss or additions on requests in the same timespan for the same period. Unfortunately the bot cannot counter-measure this phenomenon. The data shown by @ForestsWar is shown as-is and as it was at the moment of the requests to GFW.

To avoid this issue, the bot delays it's tracking by a number of days to let the data in the API settle.

This data inconsistency is believed to be due to new alerts being issued or dismissed under the same day, and is consistent with the percentage of false accuracy [described by GFW](https://blog.globalforestwatch.org/data-and-research/how-accurate-is-accurate-enough-examining-the-glad-global-tree-cover-change-data-part-1), so it's not expected to be fixed in any near future despite the API being in beta. Also despite this fact, this data source remains the most accurate when tracking global change of forests.

#### Possibly misleading maps
In order to picture a better deforestation comparison, the bot uses the country's **forest surface** instead of the total surface when drawing maps. This means that a map of a country fully deforestated is not equivalent to the entire area of the country being deforestated, as it could be the impression, but rather is the entire forestal area of the country being deforestated.

This is because of a very simple fact: **you can't deforestate area that wasn't forest**. To represent maps with the deforestated area against the entire area of a country would not be a fair comparison.

The `Mapper` service does not implement this behaviour, this happens inside the bot routine and it won't have side-effects while using the mapper as standalone.

#### Watermark counting as land
Usually when an entire country is deforestated there could appear some red spots in the bottom right corner of the map. This is because the GADM watermark is of the same color as the map land area, leading the bot to believe that those pixels in the map are also land area.

Actually this behaviour does not lead to inaccuracies in the map representation.

When drawing a map, the bot calculates the percentage of the country that has been deforestated, once it knows the percentage it counts the pixels in the map that are land and paints as many red pixels as the percentage means.
