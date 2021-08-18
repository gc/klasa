const Piece = require('./base/Piece');

/**
 * Base class for all Klasa Monitors. See {@tutorial CreatingMonitors} for more information how to use this class
 * to build custom monitors.
 * @tutorial CreatingMonitors
 * @extends Piece
 */
class Monitor extends Piece {

	/**
	 * @typedef {PieceOptions} MonitorOptions
	 * @property {boolean} [ignoreBots=true] Whether the monitor ignores bots or not
	 * @property {boolean} [ignoreSelf=true] Whether the monitor ignores itself or not
	 * @property {boolean} [ignoreOthers=true] Whether the monitor ignores others or not
	 * @property {boolean} [ignoreWebhooks=true] Whether the monitor ignores webhooks or not
	 * @property {boolean} [ignoreEdits=true] Whether the monitor ignores edits or not
	 * @property {string[]} [allowedTypes=['DEFAULT']] The types of messages allowed for this monitor
	 */

	/**
	 * @since 0.0.1
	 * @param {MonitorStore} store The Monitor Store
	 * @param {string} file The path from the pieces folder to the monitor file
	 * @param {string} directory The base directory to the pieces folder
	 * @param {MonitorOptions} [options={}] Optional Monitor settings
	 */
	constructor(store, file, directory, options = {}) {
		super(store, file, directory, options);

		/**
		 * The types of messages allowed for this monitor
		 * @see https://discord.js.org/#/docs/main/master/typedef/MessageType
		 * @since 0.5.0
		 * @type {string[]}
		 */
		this.allowedTypes = options.allowedTypes;

		/**
		 * Whether the monitor ignores bots or not
		 * @since 0.0.1
		 * @type {boolean}
		 */
		this.ignoreBots = options.ignoreBots;

		/**
		 * Whether the monitor ignores itself or not
		 * @since 0.0.1
		 * @type {boolean}
		 */
		this.ignoreSelf = options.ignoreSelf;

		/**
		 * Whether the monitor ignores others or not
		 * @since 0.4.0
		 * @type {boolean}
		 */
		this.ignoreOthers = options.ignoreOthers;

		/**
		 * Whether the monitor ignores webhooks or not
		 * @since 0.5.0
		 * @type {boolean}
		 */
		this.ignoreWebhooks = options.ignoreWebhooks;

		/**
		 * Whether the monitor ignores edits or not
		 * @since 0.5.0
		 * @type {boolean}
		 */
		this.ignoreEdits = options.ignoreEdits;
	}

	/**
	 * Run a monitor and catch any uncaught promises
	 * @since 0.5.0
	 * @param {KlasaMessage} message The message object from Discord.js
	 * @private
	 */
	async _run(message, isEdit) {
		try {
			await this.run(message, isEdit);
		} catch (err) {
			this.client.emit('monitorError', message, this, err);
		}
	}

	/**
	 * The run method to be overwritten in actual monitor pieces
	 * @since 0.0.1
	 * @param {KlasaMessage} message The discord message
	 * @returns {void}
	 * @abstract
	 */
	run() {
		// Defined in extension Classes
		throw new Error(`The run method has not been implemented by ${this.type}:${this.name}.`);
	}

	/**
	 * If the monitor should run based on the filter options
	 * @since 0.5.0
	 * @param {KlasaMessage} message The message to check
	 * @returns {boolean}
	 */
	shouldRun(message, isEdit) {
		return this.enabled &&
			this.allowedTypes.includes(message.type) &&
			!(this.ignoreBots && message.author.bot) &&
			!(this.ignoreSelf && this.client.user === message.author) &&
			!(this.ignoreOthers && this.client.user !== message.author) &&
			!(this.ignoreWebhooks && message.webhookID) &&
			!(this.ignoreEdits && isEdit) &&
			!this.client.settings.get('userBlacklist').includes(message.author.id) &&
			!(message.guild && this.client.settings.get('guildBlacklist').includes(message.guild.id));
	}

	/**
	 * Defines the JSON.stringify behavior of this monitor.
	 * @returns {Object}
	 */
	toJSON() {
		return {
			...super.toJSON(),
			ignoreBots: this.ignoreBots,
			ignoreSelf: this.ignoreSelf,
			ignoreOthers: this.ignoreOthers,
			ignoreWebhooks: this.ignoreWebhooks,
			ignoreEdits: this.ignoreEdits
		};
	}

}

module.exports = Monitor;
