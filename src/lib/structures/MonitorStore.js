const Monitor = require('./Monitor');
const Store = require('./base/Store');

/**
 * Stores all monitors for use in Klasa
 * @extends Store
 */
class MonitorStore extends Store {

	/**
	 * Constructs our MonitorStore for use in Klasa
	 * @since 0.0.1
	 * @param {KlasaClient} client The Klasa Client
	 */
	constructor(client) {
		super(client, 'monitors', Monitor);
	}

	/**
	 * Runs our monitors on the message.
	 * @since 0.0.1
	 * @param {KlasaMessage} message The message object from Discord.js
	 * @param {boolean} isEdit Is this message just an edit/update of an existing one
	 */
	run(message, isEdit) {
		for (const monitor of this.values()) if (monitor.shouldRun(message, isEdit)) monitor._run(message, isEdit);
	}

}

module.exports = MonitorStore;
