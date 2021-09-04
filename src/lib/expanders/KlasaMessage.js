const { regExpEsc } = require('../util/util');
const KlasaGlobalMap = require('../KlasaGlobalMap');

class KlasaMessage {

	constructor(message) {
		/**
		 * The command being run
		 * @since 0.0.1
		 * @type {?Command}
		 */
		this.message = message;
		KlasaGlobalMap.set(message, this);

		this.command = this.command || null;

		/**
		 * The name of the command being run
		 * @since 0.5.0
		 * @type {?string}
		 */
		this.commandText = this.commandText || null;

		/**
		 * The prefix used
		 * @since 0.0.1
		 * @type {?RegExp}
		 */
		this.prefix = this.prefix || null;

		/**
		 * The length of the prefix used
		 * @since 0.0.1
		 * @type {?number}
		 */
		this.prefixLength = typeof this.prefixLength === 'number' ? this.prefixLength : null;

		/**
		 * A command prompt/argument handler
		 * @since 0.5.0
		 * @type {CommandPrompt}
		 * @private
		 */
		this.prompter = this.prompter || null;

		// Initialize KlasaMessageEx
		this.language = message.client.languages.default;
		/*
		this.author = message.author;
		this.channel = message.channel;
		this.guild = message.guild;
		this.client = message.client;
		this.type = message.type;
		this.postable = message.postable;

		 */
		Object.assign(this, message);
		Object.defineProperty(this, 'client', { value: message.client });
		Object.defineProperty(this, 'guild', { value: message.guild });
		this._parseCommand();
	}

	/**
	 * The string arguments derived from the usageDelim of the command
	 * @since 0.0.1
	 * @type {string[]}
	 * @readonly
	 */
	get args() {
		return this.prompter ? this.prompter.args : [];
	}

	/**
	 * The parameters resolved by this class
	 * @since 0.0.1
	 * @type {any[]}
	 * @readonly
	 */
	get params() {
		return this.prompter ? this.prompter.params : [];
	}

	/**
	 * The flags resolved by this class
	 * @since 0.5.0
	 * @type {Object}
	 * @readonly
	 */
	get flagArgs() {
		return this.prompter ? this.prompter.flags : {};
	}

	/**
	 * If the command reprompted for missing args
	 * @since 0.0.1
	 * @type {boolean}
	 * @readonly
	 */
	get reprompted() {
		return this.prompter ? this.prompter.reprompted : false;
	}

	/**
	 * Checks if the author of this message, has applicable permission in this message's context of at least min
	 * @since 0.0.1
	 * @param {number} min The minimum level required
	 * @returns {boolean}
	 */
	async hasAtLeastPermissionLevel(min) {
		const { permission } = await this.message.client.permissionLevels.run(this.message, min);
		return permission;
	}


	/**
	 * Parses this message as a command
	 * @since 0.5.0
	 * @private
	 */
	_parseCommand() {
		// Clear existing command state so edits to non-commands do not re-run commands
		this.prefix = null;
		this.prefixLength = null;
		this.commandText = null;
		this.command = null;
		this.prompter = null;

		try {
			const prefix = this._customPrefix() || this._mentionPrefix() || this._prefixLess();
			if (!prefix) return;

			this.prefix = prefix.regex;
			this.prefixLength = prefix.length;
			this.commandText = this.message.content.slice(prefix.length).trim().split(' ')[0].toLowerCase();
			this.command = this.message.client.commands.get(this.commandText) || null;

			if (!this.command) return;

			this.prompter = this.command.usage.createPrompt(this, {
				flagSupport: this.command.flagSupport,
				quotedStringSupport: this.command.quotedStringSupport,
				time: this.command.promptTime,
				limit: this.command.promptLimit
			});
		} catch (error) {
			return;
		}
	}

	/**
	 * Checks if the per-guild or default prefix is used
	 * @since 0.5.0
	 * @returns {Promise<CachedPrefix | null>}
	 * @private
	 */
	_customPrefix() {
		const settings = this.message.guild ? this.message.guild.client.gateways.get('guilds').get(this.message.guild.id) : this.message.client.gateways.get('guilds').schema.defaults;
		if (!settings) return null;
		const prefix = settings.get('prefix');
		if (!prefix || !prefix.length) return null;
		const testingPrefix = this.constructor.prefixes.get(prefix) || this.constructor.generateNewPrefix(prefix);
		if (testingPrefix.regex.test(this.message.content)) return testingPrefix;
		return null;
	}

	/**
	 * Checks if the mention was used as a prefix
	 * @since 0.5.0
	 * @returns {CachedPrefix | null}
	 * @private
	 */
	_mentionPrefix() {
		const mentionPrefix = this.message.client.mentionPrefix.exec(this.message.content);
		return mentionPrefix ? { length: mentionPrefix[0].length, regex: this.message.client.mentionPrefix } : null;
	}

	/**
	 * Checks if a prefixless scenario is possible
	 * @since 0.5.0
	 * @returns {CachedPrefix | null}
	 * @private
	 */
	_prefixLess() {
		return this.message.client.options.noPrefixDM && this.message.channel.type === 'dm' ? { length: 0, regex: null } : null;
	}

	/**
	 * Caches a new prefix regexp
	 * @since 0.5.0
	 * @param {string} prefix The prefix to store
	 * @returns {CachedPrefix}
	 * @private
	 */
	static generateNewPrefix(prefix) {
		const prefixObject = { length: prefix.length, regex: new RegExp(`^${regExpEsc(prefix)}`) };
		this.prefixes.set(prefix, prefixObject);
		return prefixObject;
	}

}

/**
 * Cache of RegExp prefixes
 * @since 0.5.0
 * @type {Map<string, CachedPrefix>}
 * @private
 */
KlasaMessage.prefixes = new Map();

module.exports = KlasaMessage;
