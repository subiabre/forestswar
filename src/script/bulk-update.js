const GLAD = require('../service/glad');
const Mapper = require('../service/mapper');
const Country = require('../service/country');

const bot = require('../bot');
const mapper = new Mapper();
const api = new GLAD();
const period = api.formatPeriod('2020-10-01', '2020-11-29');

const run = async () => {
    let suriname = await new Country('SUR').getByCode();
    let deforestation = await api.getAlerts(period);
    let deforestated = await bot.getMemory();

    let green = await mapper.kilometersToPixels(suriname.data.area, suriname);
    let brown = await mapper.kilometersToPixels(deforestated.area, suriname);
    let red = await mapper.kilometersToPixels(deforestation.area, suriname);

    let map = await suriname.getMapImage();

    map = await mapper.paintArea(map, green, '#98d587');
    map = await mapper.paintArea(map, brown, '#e94122');
    map = await mapper.paintArea(map, red, '#dbc4a5');

    await map.write('../../map/bulk-update.png');

    console.log(deforestation);
}

run();
