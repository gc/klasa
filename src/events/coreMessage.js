const KlasaMessage = require('../lib/expanders/KlasaMessage');
const { Event } = require('klasa');

module.exports = class extends Event {

	constructor(...args) {
		super(...args, { event: 'message' });
	}

	run(message) {
		const kmx = new KlasaMessage(message);
		if (this.client.ready) this.client.monitors.run(kmx);
	}

};
