const { Event } = require('klasa');

module.exports = class extends Event {

	run(message, command, params, error) {
		if (error instanceof Error) this.client.emit('wtf', `[COMMAND] ${command.path}\n${error.stack || error}`);
		if (error.message) message.channel.send(error.message).catch(err => this.client.emit('wtf', err));
		else message.channel.send(error).catch(err => this.client.emit('wtf', err));
	}

};
