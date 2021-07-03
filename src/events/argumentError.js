const { Event } = require('klasa');

module.exports = class extends Event {

	run(message, command, params, error = 'Unknown error') {
		if (typeof error !== 'string') {
			console.error(error);
			message.channel.send(`An unexpected error occured.`).catch(err => this.client.emit('wtf', err));
		} else {
			message.channel.send(error).catch(err => this.client.emit('wtf', err));
		}
	}

};
