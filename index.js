'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    alexa = require('alexa-app'),
    alexaApp = new alexa.app('Node Saga');

	console.log('alexaApp Data');
	console.log(alexaApp);
	
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.post('/', function (req, res) {
	console.log("Inside post method");
    alexaApp.launch(function(req, res) {
		console.log('launch');
		alexaApp.db.loadSession(req.userId).then((savedSession) => {
			console.log('loaded session ', savedSession);
			var say = [];
			var used = [];
			// copy saved session into current session
			var session = savedSession || {};
			console.log('session=', session);
			if (session) {
				var all = JSON.parse(session.all || '{}');
				used = Object.keys(all);
				Object.keys(session).forEach((key) => {
					res.session(key, savedSession[key]);
				});
			}
			say.push('<s>Welcome to Quiz for America. <break strength="medium" /></s>');
			if (!savedSession) {
				say.push('<s>Each quiz has ten questions.</s>');
				say.push("<s>I'll ask a multiple choice or true false question.</s>");
				say.push('<s>Say true, false, or the letter matching your answer.</s>');
				say.push('<s>To hear a question again, say repeat.</s>');
				say.push('<s>Say stop <break strength="medium" /> to end the quiz early.</s>');
			}
			//say = say.concat(alexaApp.startQuiz(res, used));
			res.say(say.join('\n'));
			res.send();
		});
		return false;  // wait for promise to resolve
	});
	
	alexaApp.error = function(e, req, res){
		console.log(e);
		throw e;
	}
});