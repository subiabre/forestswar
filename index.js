var express = require('express'),
    app = express(),
    Deforestation = require('./src/bot'),
    bot = new Deforestation();

app.get('/status', (req, res) => {
    res.send({
        data: bot.getLog()
    });
});

var listener = app.listen(process.env.PORT, async () => {
    await bot.routine();
    
    let address = 'http://localhost:' + listener.address().port;
    console.log('SERVER LISTENING AT: ' + address);
    console.log('REPORTING STATUS AT: ' + address + '/status');
});
