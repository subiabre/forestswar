var express = require('express'),
    app = express(),
    Deforestation = require('./src/bot'),
    bot = new Deforestation();

app.get('/', (req, res) => {
    res.send(bot.getLog());
});

var listener = app.listen(process.env.PORT, async () => {
    let address = 'http://localhost:' + listener.address().port;
    bot.console('SERVER LISTENING AT: ' + address);

    await bot.routine();
});
