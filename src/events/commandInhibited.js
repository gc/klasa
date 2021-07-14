const { Event } = require('klasa');

module.exports = class extends Event {

	run(message, command, response) {
		if (response && response.length) {
			if (Array.isArray(response)) {
				message.channel.send({ content: response.join('\n') });
			} else {
				message.channel.send({ content: response });
			}
		}
	}

};
