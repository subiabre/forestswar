A bot to help visualize deforestation. Inspired by [a friend's one](https://gitlab.com/wishiwasrubin/fwbot).

[![time tracker](https://wakatime.com/badge/gitlab/subiabre/deforestation.svg)](https://wakatime.com/badge/gitlab/subiabre/deforestation)

1. [Project summary](#tracking-and-mapping-deforestation)
    1. [How does it work](#how-does-it-work)
    2. [Why is this important](#why-is-this-important)
    3. [How is deforestated area calculated](#how-is-deforestated-area-calculated)
    4. [How are maps done](#how-are-maps-done)
2. [Developer manual](#how-to-setup-in-local-environment)
    1. [Using the bot services as standalone](#using-the-bot-services-as-standalone)
3. [Support](#support)

## Tracking and mapping deforestation
You've probably seen many times comparisons like *"an area the size of X football fields is lost every Y time"*, and while said data might be true, it's often hard to actually picture how much deforestation happens in our planet. This bot aims to make it easier.

Follow it on [Twitter](https://twitter.com/ForestsWar) and start understanding just how much forest area is deforestated.

>**If you think this project is important, please spread the word about it**, share the Twitter page with your friends and family. If you think this project could be improved you are welcome to add contributions via Pull Requests.

### How does it work?
The idea is simple. Since 2015 there's been a war between global deforestation and forest area. Deforestation just keeps growing larger and larger, conquering former forest ground. Will your country survive the deforestation?

This bot has an internal database that keeps track of deforestated area thanks to [GLAD alerts](https://glad.umd.edu/projects/global-forest-watch). Everytime the bot is run, it fetches the total area deforestated since january 1st 2015, the start of "the war", and the current date, then it compares the area to the area of a country.

Maps are pixel by pixel comparisons of deforestated area against the forest area of a country (represented as if the country's forest area is the total area) from the `list.json` package. When the whole area of a country has been lost to deforestation, the bot goes on to the next country in the list.

This process may take years. Hopefully more than it takes to recover the deforestated area.

### Why is this important?
Main concern for deforestation is that replanting and recovering forest biomass takes years, if not decades.

This bot aims to factually know the rate at which we exploit forests' resources and make the data accessible and easy to understand for anyone who is interested. 

>All data displayed is retrieved from third party services. This bot **does not** generate, manipulate or destroy any data about deforestation.

Even though this bot compares deforestated areas against countries areas, it's important to note that not the entire area of any country listed is actually forest, so the deforestation rate actually appears as smaller than the actual rate at which forests disappear.

### How is deforestated area calculated?
The [GLAD](https://glad.umd.edu/projects/global-forest-watch) laboratory keeps a public dataset of tree cover change based on Landsat satellite imagery.

[Global Forest Watch](https://www.globalforestwatch.org/) puts it in a easy to use, updated [API](http://production-api.globalforestwatch.org/). Although it could work a little bit better (it's known to show frequents loss of data that the bot is designed to minimize).

For implementation details check the `GLAD` service.

### How are maps done?
[GADM](https://gadm.org/) provides a nice set of clean map images by country.

[REST countries](https://restcountries.eu/) serves a handy API to obtain countries data.

[Jimp](https://www.npmjs.com/package/jimp), [count-pixels](https://www.npmjs.com/package/count-pixels) and [replace-color](https://www.npmjs.com/package/replace-color) do all the real work regarding image manipulation.

For implementation details check the `Mapper` service.

## How to setup in local environment
Before anything you'll need to have [Node.js](https://nodejs.org) and [npm](http://npmjs.com) installed. Then:

```console
$ git clone https://github.com/subiabre/deforestation.git
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

### Using the bot services as standalone
This package can be used to generate maps and obtain deforestation data independently of the bot behaviour.

First, you should disable the Twitter flag from your `.env`.

To use the bot services as you please, you can simply play with them: **all the code is well documented** and commented, so it shouldn't be a big hassle to get the bot to do what you want. All the services are detached from the bot and should work fine independently.

Take this example on how to generate a map of your desired country in the desired time period:
```js
const Deforestation = require('./src/bot');
const deforestation = new Deforestation();

// Get the deforestated area for our period
let period = deforestation.glad.formatPeriod('2015-01-01', '2015-12-31');
let area = await deforestation.glad.getAlerts(period);

// Draw a map with the obtained area
let map = await deforestation.map.setCountry('ESP')
    .paintArea(area);

// Save the resulting map to map/map.png
map.write('./map/map.png');
``` 

## Support
You can contact me at [twitter](https://twitter.com/facutxt) about this bot. If you found a bug or have any concern about this project, please open an Issue.

If you find this bot especially interesting, please consider telling more people about it. Starring this repository also helps.
