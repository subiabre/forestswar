var express = require('express'),
    app = express(),
    Deforestation = require('./src/bot'),
    bot = new Deforestation();

app.get('/status', (req, res) => {
    res.send({
        data: bot.getLog()
    });
});

var listener = app.listen(process.env.PORT, () => {
    console.log('BOT LISTENING AT: http://localhost:' + listener.address().port);
});
