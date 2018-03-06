'use strict';

const express = require('express'),
    bodyParser = require('body-parser');
	
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

function buildResponse(title, output, repromptText, shouldEndSessionValue) {
    console.log("--Session--" + shouldEndSessionValue);
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
        shouldEndSession: shouldEndSessionValue
	};
}

function sendResponse(res, sessionAttributes, speechResponse){
	return res.json({
		version: '1.0',
		sessionAttributes,
		response: speechResponse
	});
}

function welcomeMessage(callback){
	const sessionAttributes = {},
	cardTitle = 'Welcome',
	speechOutput = 'Welcome Test',
	repromptText = 'Welcome Test2',
    shouldEndSession = false;
    console.log('**Session 1** ' + shouldEndSession);
	callback(sessionAttributes, buildResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelloWorld(intent, session, callback) {
    const sessionAttributes = {},
        cardTitle = 'Hello World',
        speechOutput = 'Welcome to Hello World.',
        repromptText = 'Hello World Again!',
        shouldEndSession = true;
    console.log('**Session 2** ' + shouldEndSession);
    callback(sessionAttributes, buildResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback){
	const cardTitle = 'Session Ended',
	speechOutput = 'Thank you. Try again',
    shouldEndSession = true;
    console.log('**Session 3** ' + shouldEndSession);
	callback({}, buildResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    welcomeMessage(callback);
}

function onIntent(req, session, callback){
	console.log(`Inside handle Intent Req Id = ${req.requestId}, session = ${session.sessionId}`);
	
	const intent = req.intent,
	intentName = intent.name;
	
	if(intentName === 'HelloWorld'){
		console.log('Inside HelloWorld');
        welcomeMessage(callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        console.log('Inside Help');
        welcomeMessage(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        console.log('Inside Stop');
        handleSessionEndRequest(callback);
    } else {
        console.log('Inside Others');
        throw new Error('Invalid intent');
    }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}

app.post('/', (req, res) => {
    let event = req.body;
	console.log(event);
    if (event.session.new) {
        console.log('Inside new session');
		onSessionStarted({requestId: event.request.requestId}, event.session);
	}
	
    if (event.request.type === 'LaunchRequest') {
        console.log('Inside the launch request');
        onLaunch(event.request,event.session,
            (sessionAttributes, speechletResponse) => {
                sendResponse(res, sessionAttributes, speechletResponse);
                //callback(null, buildResponse(sessionAttributes, speechletResponse));
            });
    } else if (event.request.type === 'IntentRequest') {
        console.log('Inside the intent request');
        onIntent(event.request,event.session,
            (sessionAttributes, speechletResponse) => {
                console.log("Session Attr " + JSON.stringify(sessionAttributes) + "\n " + JSON.stringify(speechletResponse));
                sendResponse(res, sessionAttributes, speechletResponse);
                //callback(null, buildResponse(sessionAttributes, speechletResponse));
            });
    } else if (event.request.type === 'SessionEndedRequest') {
        console.log("Inside session end");
        onSessionEnded(event.request, event.session);
        callback();
    }
	
});