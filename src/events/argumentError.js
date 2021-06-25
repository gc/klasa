const { Event } = require('klasa');

module.exports = class extends Event {

	run(message, command, params, error = 'Unknown error') {
		const errorMessage = typeof err === 'string' ? error : error.message || 'Unknown error';
		message.sendMessage(errorMessage).catch(err => this.client.emit('wtf', err));
	}

};
