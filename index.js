'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    alexa = require('alexa-app'),
	app = express();
	
//Always setup the alexa app and attach it to express first
var alexaApp = new alexa.app('Node Saga');
alexaApp.express({
	expressApp: app,
	checkCert: false,
	debug: true
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.post('/', function (req, res) {
	console.log("Inside post method");
    alexaApp.launch(function(req, res){
		console.log('Test');
		res.say("You launched the app!");
	});
});