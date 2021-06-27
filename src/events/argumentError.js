const { Event } = require('klasa');

module.exports = class extends Event {

	run(message, command, params, error = 'Unknown error') {
		if (typeof error !== 'string') {
			console.error(error);
			message.sendMessage(`An unexpected error occured.`).catch(err => this.client.emit('wtf', err));
		} else {
			message.sendMessage(error).catch(err => this.client.emit('wtf', err));
		}
	}

};
