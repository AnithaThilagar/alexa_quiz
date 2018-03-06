'use strict';

const express = require('express'),
    bodyParser = require('body-parser'),
    alexa = require('alexa-app'),
    app = express(),
    alexaApp = new alexa.app("NodeSaga"),
    quiz = require('./quiz');

alexaApp.db = require('./db/mock-db');

alexaApp.express({
    expressApp: app,
    checkCert: false
});

alexaApp.error = function (e, req, res) {
	console.log("Error in Alexa");
    console.log(e);
    throw e;
};

alexaApp.card = function (current) {
    console.log('createCard: current=', current);
    // current: {'3': 'A', '4': 'false'}
    var card = {
        type: 'Simple',
        title: 'Quiz results'
    };
    var ids = Object.keys(current);
    if (!ids.length) {
        card.content = 'No results for this session.';
        return card;
    }
    var content = 'You got ' + quiz.getScore(current) + ' of ' + ids.length;
    content += ids.length === 1 ? ' question' : ' questions';
    content += ' correct.\n';
    Object.keys(current).forEach((q) => {
        var question = quiz.getQuestion(q);
        var answer = current[q];
        var isCorrect = question.isCorrect(answer);
        var symbol = isCorrect ? '✔' : '✗';
        content += '\n' + symbol + ' ' + question.q.question + '\nAnswer: ';
        if (question.isBoolean()) {
            content += question.q.answer.toLowerCase();
        } else {
            content += question.q.answers[question.q.answer];
        }
        content += '\n' + question.q.explanation;
        if (question.q.source) {
            content += ' (source: ' + question.q.source + ')';
        }
        content += '\n';
    });
    content += '\nContent created by volunteers with DevProgress\n';
    content += 'http://devprogress.us\n';
    card.content = content;
    return card;
};

alexaApp.startQuiz = function (response, used) {
	console.log('Inside Start Quiz');
    var say = ['<s>First question:</s>'];
    // set current list of questions to empty
    response.session('current', '{}');
    var q = quiz.getNextQuestion(used);
	console.log('Q is - '+q);
    if (q) {
        say.push(q.questionAndAnswers());
        response.session('q', q.id);
        response.shouldEndSession(false, 'What do you think? Is it ' + q.choices() + '?');
    } else {
        say.push("That's all the questions I have for now.  Remember to vote on November eighth.");
    }
	console.log(say);
    return say;
};

alexaApp.launch(function (request, response) {
    console.log('launch');
	/*var say = [];
	say.push('<s>Welcome to Quiz for America. <break strength="medium" /></s>');
    response.say(say.join('\n'));
	response.send();*/
	alexaApp.db.loadSession(request.userId).then((savedSession) => {
        console.log('loaded session ', savedSession);
        var say = [];
        var used = [];
        // copy saved session into current session
        var session = savedSession || {};
        console.log('session=', session);
        if (session) {
            //var all = JSON.parse(session.all || '{}');
            used = Object.keys(session.all);
            Object.keys(session).forEach((key) => {
                response.session(key, savedSession[key]);
            });
        }
		console.log('Line 1');
        say.push('<s>Welcome to Quiz for America. <break strength="medium" /></s>');
        if (!savedSession) {
            say.push('<s>Each quiz has ten questions.</s>');
            say.push("<s>I'll ask a multiple choice or true false question.</s>");
            say.push('<s>Say true, false, or the letter matching your answer.</s>');
            say.push('<s>To hear a question again, say repeat.</s>');
            say.push('<s>Say stop <break strength="medium" /> to end the quiz early.</s>');
        }
		console.log('Line 2');
        //say = say.concat(alexaApp.startQuiz(response, used));
        response.say(say.join('\n'));
        response.send();
    });
    //return false;  // wait for promise to resolve
});

alexaApp.intent('AMAZON.HelpIntent', function (request, response) {
    response.say('Say repeat <break strength="medium" /> to hear the question again, or stop <break strength="medium" /> to end.');
    response.shouldEndSession(false);
});

alexaApp.stopOrCancel = function (request, response) {
    var current = JSON.parse(request.session('current') || '{}');
    var score = quiz.getScore(current);
    var say = ['Thanks for playing Quiz for America. '];
    if (Object.keys(current).length) {
        say.push('<s>You got ' + score + ' questions correct.</s>');
        say.push('<s>Check your Alexa app for detailed results.</s>');
        response.card(alexaApp.card(current));
    }
    say.push('<s>Remember to vote on November eighth.</s>');
    response.say(say.join('\n'));
};

alexaApp.intent('AMAZON.StopIntent', function (request, response) {
    alexaApp.stopOrCancel(request, response);
});

alexaApp.intent('AMAZON.CancelIntent', function (request, response) {
    alexaApp.stopOrCancel(request, response);
});

alexaApp.intent('CardIntent', function (request, response) {
    response.card(alexaApp.card(JSON.parse(request.session('current') || '{}')));
    response.say('Your results have been sent to the Alexa app.');
});

alexaApp.intent('RepeatIntent', function (request, response) {
    var q = quiz.getQuestion(request.session('q'));
    response.shouldEndSession(false, 'What do you think? Is it ' + q.choices() + '?');
    response.say(q.questionAndAnswers());
});

alexaApp.intent('AnotherIntent', function (request, response) {
    var all = JSON.parse(request.session('all') || '{}');
    var say = ["<s>Ok. Let's start another quiz. <break strength=\"medium\" /></s>"];
    say = say.concat(app.startQuiz(response, Object.keys(all)));
    response.say(say.join('\n'));
});

alexaApp.intent('AnswerIntent',
    {
        // A B C true false
        'slots': { 'ANSWER': 'ANSWERS' },
        'utterances': [
            '{-|ANSWER}'
        ]
    },

    function (request, response) {
        var session = request.sessionDetails.attributes;
        // {'1': 'A', '2': 'false'}
        var all = JSON.parse(request.session('all') || '{}');
        var current = JSON.parse(request.session('current') || '{}');
        var used = Object.keys(all);
        var currentQuestionId = request.session('q');
        console.log('answer question=' + currentQuestionId + ' session=', session);
        var say = [];
        var q = currentQuestionId ? quiz.getQuestion(currentQuestionId) : null;
        var score = quiz.getScore(JSON.parse(request.session('current') || '{}'));
        // found question in session; check answer
        if (q) {
            var answer = request.slot('ANSWER') || 'X';
            answer = answer.slice(0, 1).toUpperCase();
            if (q.validAnswers().indexOf(answer) < 0) {
                answer = 'X';
            }
            console.log('answer normalized=' + answer);
            alexaApp.db.logAnswer(currentQuestionId, answer);
            var sayAnswer = q.answer(answer);
            if (q.isCorrect(answer)) {
                say.push("<s>That's correct!</s>");
                score += 1;
            } else {
                say.push('<s>The correct answer is ' + q.answerText() + '.</s>');
            }
            say.push(q.explanation());
            // save question and answer to current and all questions
            current[currentQuestionId] = answer;
            all[currentQuestionId] = answer;
        }
        session.current = JSON.stringify(current);
        session.all = JSON.stringify(all);
        // if 10 questions, stop and send results
        var numQuestions = Object.keys(current).length;
        console.log('questions=', numQuestions);
        if (numQuestions === 10) {
            say.push("<s>Congratulations! You've answered ten questions.</s>");
            say.push('<s>Check your Alexa app for detailed results.</s>');
            say.push('<s>To start another quiz, say <break strength="x-strong" /> another.</s>');
            say.push("<s>Don't forget to vote on November eighth.</s>");
            response.card(alexaApp.card(current));
        } else {
            // get next question
            var next = quiz.getNextQuestion(Object.keys(all));
            if (next) {
                say.push('<s>Question ' + (numQuestions + 1) + '. <break strength="x-strong" /></s>');
                say.push(next.questionAndAnswers());
                session.q = next.id;
                response.shouldEndSession(false, 'What do you think? Is it ' + next.choices() + '?');
            } else {
                say.push("That's all the questions I have for now. You got " + score +
                    " correct. Remember to vote on November eighth.");
                response.card(alexaApp.card(current));
            }
        }
        Object.keys(session).forEach((key) => {
            response.session(key, session[key]);
        });
        alexaApp.db.saveSession(request.userId, session).then(() => {
            response.say(say.join('\n'));
            response.send();
        });
        return false;
    }
);


if (process.argv.length > 2) {
    var arg = process.argv[2];
    if (arg === '-s' || arg === '--schema') {
        console.log(alexaApp.schema());
    }
    if (arg === '-u' || arg === '--utterances') {
        console.log(alexaApp.utterances());
    }
}

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});