// jshint esversion: 6

var questions = require('./questions.json');

var quiz = {};

function Question(id) {
    this.id = id;
    this.q = questions[id];
}

Question.prototype = {
    isBoolean: function () {
        console.log("Inside boolean check");
        var a = this.q.answer.toUpperCase();
        return (a === 'TRUE' || a === 'FALSE');
    },

    sayQuestion: function() {
        return '<s>'+this.q.question+'</s>';
    },

    answer: function(a) {
		console.log("Inside answer");
        var key = a || '';
        if (this.isBoolean()) {
            if (a.startsWith('T')) {
                key = 'TRUE';
            }
            if (a.startsWith('F')) {
                key = 'FALSE';
            }
        } else {
            key = key.slice(0, 1).toUpperCase();
        }
        return this.q.answers ? this.q.answers[key] || '' : this.q.answer;
    },

    sayLetter: function (letter) {
        console.log("Inside say letter " + letter);
        return '<say-as interpret-as="characters">' + letter +'</say-as> <break strength="medium" /> ';
    },

    validAnswers: function () {
        console.log('Inside valid ans');
        return this.isBoolean() ? ['T', 'F'] : ['A', 'B', 'C'];
    },

    answers: function () {
        console.log('Inside answers**');
        var say = [];
        if (this.isBoolean()) {
            return null;
        }
        var all = this.q.answers;
        var letters = Object.keys(all).sort();
        letters.forEach((a) => {
            say.push(this.sayLetter(a)+all[a]+'. <break strength="x-strong" />');
        });
        return say.join(' ');
    },

    questionAndAnswers: function () {
        console.log('Q & A');
        var say = [this.sayQuestion()];
        var answers = this.answers();
        if (answers) {
            say.push('<s>Is it?</s>');
            say.push(answers);
        }
        return say.join('\n');
    },

    choices: function () {
        console.log('Choice');
        if (this.isBoolean()) {
            return 'true or false';
        }
        return this.answers();
    },

    isCorrect: function(answer) {
		console.log("Inside is correct");
        var correct = this.q.answer;
        console.log('Correct ' + correct);
        return this.q.answer.toUpperCase().slice(0, 1) === answer.toUpperCase().slice(0, 1);
    },

    answerText: function () {
        console.log('Ans Txt');
        if (this.isBoolean()) {
            return this.q.answer;
        }
        var answer = this.q.answers[this.q.answer];
        console.log("Ans Text = ans " + answer);
        if (!answer) {
            return '';
        }
        return this.sayLetter(this.q.answer)+', '+answer+'. ';
    },

    explanation: function () {
        console.log("Expln");
        return this.q.explanation;
    },

};

quiz.getNextQuestion = function(used) {
    var avail = [];
    Object.keys(questions).forEach((q) => {
        if (used.indexOf(q) < 0) {
            avail.push(q);
        }
    });
    if (!avail.length) {
        return null;
    }
    var idx = Math.floor(Math.random() * avail.length);
    return new Question(avail[idx]);
};

quiz.getQuestion = function(id) {
    return id ? new Question(id) : null;
};

quiz.getScore = function (responses) {
    console.log('Get score');
    // responses = {questionId: response, ... }
    if (!responses) {
        console.log('No resp');
        return 0;
    }
    var correct = 0;
    Object.keys(responses).forEach((questionId) => {
        console.log("Check " + questionId);
        if (!questions[questionId]) {
            return;
        }
        var question = new Question(questionId);
        if (question.isCorrect(responses[questionId])) {
            correct += 1;
        }
    });
    return correct;
};

module.exports = quiz;
