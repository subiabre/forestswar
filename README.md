# Deforestation
A bot to help visualize deforestation. Inspired by [a friend's one](https://gitlab.com/wishiwasrubin/fwbot).

[![time tracker](https://wakatime.com/badge/gitlab/subiabre/deforestation.svg)](https://wakatime.com/badge/gitlab/subiabre/deforestation)

1. [Project summary](#tracking-and-mapping-deforestation)
2. [Developer manual](#how-to-setup-in-local-environment)

## Tracking and mapping deforestation
You've probably read many times various comparisons like *"an area the size of X football fields is lost every Y time"*, and while said data might be true, it's often hard to actually picture how much deforestation happens in our planet. This bot aims to make it easier.

Follow it on [Twitter](https://twitter.com/DeforestationWr) and start understanding just how much forest area is deforestated.

### How does it work?
This bot has an internal database that keeps track of [GLAD alerts](https://glad.umd.edu/projects/global-forest-watch). Everytime a new alert is issued, the bot calculates the area lost, updates it's database, creates a map to illustrate it and updates the Twitter feed.

Maps are approximate size comparison of deforestated area against a country from the [country-list](https://www.npmjs.com/package/country-list) package. When the whole area of a country has been lost to deforestation, the bot goes on to the next country in the list.

This process may take years. Hopefully more than it takes to recover the deforestated area.

### Why is this important?
Main concern for deforestation is that replanting and recovering forest biomass takes years, if not decades.

This bot aims to factually know the rate at which we exploit forests' resources and make it easy to understand and accessible for anyone who is interested. 

>All data displayed is retrieved from third party services. This bot **does not** generate, manipulate or destroy any data about deforestation.

### How is deforestated area calculated?
The [GLAD](https://glad.umd.edu/projects/global-forest-watch) laboratory keeps a public dataset of tree cover change based on Landsat satellite imagery.

[Global Forest Watch](https://www.globalforestwatch.org/) puts it in a easy to use, updated [API](http://production-api.globalforestwatch.org/).

### How are maps done?
[GADM](https://gadm.org/) provides a nice set of clean map images by country.

[REST countries](https://restcountries.eu/) serves a handy API to obtain countries data.

[Jimp](https://www.npmjs.com/package/jimp) and [replace-color](https://www.npmjs.com/package/replace-color) do all the real work regarding image manipulation.

For implementation details check the `Mapper` service.

## How to setup in local environment
Before anything you'll need to have [Node.js](https://nodejs.org), [npm](http://npmjs.com) and [MongoDB](https://www.mongodb.com) installed.

```console
$ git clone https://gitlab.com/subiabre/deforestation.git
$ cd deforestation
$ npm install
```

The bot takes environment configuration:
```console
$ cp .env.example .env
```
You'll find commentary explaining all the keys.

To launch the bot:
```console
$ node index.js
```

This project uses [Mocha](https://mochajs.org/) as testing framework:
```console
$ npm test
```

## Using the bot as standalone
This package can be used to generate maps and obtain deforestation data without using the Twitter service.

Firstly, you should disable the Twitter flag from your `.env`.

To use the bot services as you please, you can simply play with them: **all the code is well documented** and commented, so it shouldn't be a big hassle to get the bot to do what you want.

Take this example on how to generate a map of your desired country in the desired time period:
```js
const Deforestation = require('./src/bot');
const bot = new Deforestation();

let period = bot.glad.formatPeriod('2015-01-01', '2015-12-31');
let country = 'ESP'; // Spain

async () => {
    let area = await bot.glad.getAlerts(period); // Get the deforestated are for our period
    let map = await bot.map.paintArea(area); // Draw a map with the obtained area

    map.write('./map/map.png'); // Save the resulting map to map/map.png
}
``` 
