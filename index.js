const bot = require('./src/bot');

const run = async () => {
    let routine = await bot.routine();

    await bot.consoleSave('log.json');
    process.exit(routine);
}

run();
