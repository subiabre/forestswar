# Forests War Bot
A bot to help visualize tree cover loss across the world.

![logo_300](https://user-images.githubusercontent.com/61125897/76841080-8eb67180-6838-11ea-8173-62c5ef5ce0b0.png)

This package contains the application that runs and serves the Twitter feed at twitter.com/[@ForestsWar](https://twitter.com/ForestsWar). Everyday at 19:00 UTC, this app is run as described in `bot.routine()`.

1. [About](#About)
2. [Usage](#Usage)
3. [Support](#Support)
4. [Concerns](#Concerns-about-accuracy-and-processing-of-data)

## About
I created this bot because I found it hard to visualize just how much area is deforestated in comparisons like "*1 football pitch per minute*". Inspired by a friend's [one](https://gitlab.com/wishiwasrubin/fwbot) and someone else's [bot](https://twitter.com/WorldWarBot).

This bot fetches data from [Global Forests Watch](https://www.globalforestwatch.org/) to calculate the lost area since january 1st 2015. The aggregated lost area is then compared against the forest area of a country from a [list](https://en.wikipedia.org/wiki/List_of_countries_by_forest_area) of 192 countries.

To make the comparisons easy to understand, the bot draws a map using images from [GADM](https://gadm.org/). These maps are a pixel exact representation of the deforestated area against the forest area from that country.

When the data is obtained and the map is drawn, a new status update is sent to [Twitter](https://twitter.com/ForestWar).

## Usage
This package contains some services that could be of great utility for independent researchers and developers, because of that, services are completely decoupled from the bot itself and can be used as standalone packages.

All code is well documented and commented, so it shouldn't be a hassle to work with them.

Consider the following examples:

1. Generate a map painting 200 square kilometers in Andorra in blue.
```js
const Mapper = require('./src/service/mappper'),
    mapper = new Mapper();

let map = await mapper.setCountry('AND')
    .paintArea(200, '#0000ff');
        
map.write('map/AND.png');
```

2. Obtaining the deforestation for 2015.
```js
const GLAD = require('./src/service/glad'),
    glad = new GLAD();

let period = glad.formatPeriod('2015-01-01', '2015-12-31'),
    area = await glad.getAlerts(period);

console.log(area);
```

## Support
If you think this project is interesting, please give it a follow on Twitter and a star in GitHub.

If you think this project is important, please tell your friends and family about it.

If you think this project could be better, Issues and Pull Requests are open.

### Concerns about accuracy and processing of data:
The following are some notes on this project's data usage with explanations about why they occur on how does this project attempt to fix them.

#### Data loss
Due to unknown causes the GFW API presents frequent and irregular data changes, showing different ammounts of data loss on requests in the same timespan for the same period. Bot is designed to minimize this data loss from the GFW API by only using the accumulated area.

This data loss is consistent with the percentage of false accuracy [described by GFW](https://blog.globalforestwatch.org/data-and-research/how-accurate-is-accurate-enough-examining-the-glad-global-tree-cover-change-data-part-1), so it's not expected to be fixed in any near future despite the API being in beta. Also despite this fact, this data source remains **the most accurate** when tracking global change of forests.

#### Possibly misleading maps
In order to picture a better deforestation comparison, the bot uses the country's **forest surface** instead of the total surface when drawing maps. This means that a map of a country fully red is not equivalent to the entire area of the country being deforestated, as it could be the impression, but rather is the entire forestal area of the country being deforestated.

This is because of a very simple fact: **you can't deforestate area that wasn't forest**. To represent maps with the deforestated area against the entire area of a country would not be a fair comparison.

#### Watermark counting as land
Usually when an entire country is deforestated there will appear some red spots in the bottom right corner of the map. This is because the GADM watermark is of the same color as the map land area, leading the bot to believe that those pixels in the map are also land area.

Actually this behaviour does not lead to inaccuracies in the map representation.

When drawing a map, the bot calculates the percentage of the country that has been deforestated, once it knows the percentage it counts the pixels in the map that are land and paints as many red pixels as the percentage means.
