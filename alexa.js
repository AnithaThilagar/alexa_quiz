'use strict';

const Alexa = require("alexa-sdk");

module.exports = (req, res) => {
    const handlers = {
        'LaunchRequest': function () {
            this.emit('HelloIntent');
        },
        'HelloIntent': function () {
            this.emit(':tell', 'Say Hello');
            this.emit(':responseReady');
        },
        'Unhandled': function () {
            this.response.speak("Sorry, I have not programmed to understand this yet");
            this.emit(':responseReady');
        }
    };

    exports.handler = function (event, context, callback) {
        console.log('Inside the handler methods');
        const alexa = Alexa.handler(event, context, callback);
        alexa.registerHandlers(handlers);
        alexa.execute();
    };
}