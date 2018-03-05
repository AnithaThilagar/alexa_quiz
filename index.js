'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    AlexaAppServer = require('alexa-app-server');
	
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

function buildResponse(title, output, repromptText, shouldEndSession){
	return {
		outputSpeech: {
			type: 'PlainText',
			text: output
		},
		card: {
			type: 'Simple',
			title: `Node Saga - ${title}`,
			content: `Node Saga - ${output}`
		},
		reprompt: {
			outputSpeech: {
				type: 'PlainText',
				text: repromptText
			}
		},
		shouldEndSession
	};
}

function sendResponse(sessionAttributes, speechResponse){
	return {
		version: '1.0',
		sessionAttributes,
		response: speechResponse
	};
}

function welcomeMessage(callback){
	const sessionAttributes = {},
	cardTitle = 'Welcome',
	speechOutput = 'Welcome Test',
	repromptText = 'Welcome Test2',
	shouldEndSession = false;
	callback(sessionAttributes, buildResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback){
	const cardTitle = 'Session Ended',
	speechOutput = 'Thank you. Try again',
	shouldEndSession = true;
	callback({}, buildResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleIntent(req, session, callback){
	console.log(`Inside handle Intent Req Id = ${req.requestId}, session = ${session.sessionId}`);
	
	const intent = req.intent,
	intentName = intent.name;
	
	if(intentName === 'HelloWorld'){
		console.log('Inside HelloWorld');
		getWelcomeResponse(callback);
	} else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

app.post('/', (req, res) => {
	function callback(error, response){
		res.json(response);
		return true;
	}
	
	console.log(callback);
	
	let event = req.body;
	console.log(event);
	
	if(event.session.new){
		onSessionStarted({
			requestId: event.request.requestId
		}, event.session);
	}
	
	if (event.request.type === 'LaunchRequest') {
        onLaunch(event.request,
            event.session,
            (sessionAttributes, speechletResponse) => {
                callback(null, buildResponse(sessionAttributes, speechletResponse));
            });
    } else if (event.request.type === 'IntentRequest') {
        onIntent(event.request,
            event.session,
            (sessionAttributes, speechletResponse) => {
                callback(null, buildResponse(sessionAttributes, speechletResponse));
            });
    } else if (event.request.type === 'SessionEndedRequest') {
        onSessionEnded(event.request, event.session);
        callback();
    }
	
});