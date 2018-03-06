'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    alexa = require('alexa-app'),
    app = express(),
    alexaApp = new alexa.app("NodeSaga");

alexaApp.express({
    expressApp: app,
    checkCert: false
});

alexaApp.launch(function (req, res) {
    console.log('Inside the alexa app');
    res.say("Launched the app!");
});

alexaApp.intent("HelloWorld", {
    "slots": {},
    "utterances": ["Hello World"]
}, function (req, res) {
    res.say("You said Hello World!!");
});

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});