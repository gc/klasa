const { Structures } = require('discord.js');
const CommandPrompt = require('../usage/CommandPrompt');
const { regExpEsc } = require('../util/util');

module.exports = Structures.extend('Message', Message => {
	/**
	 * Klasa's Extended Message
	 * @extends external:Message
	 */
	class KlasaMessage extends Message {

		/**
		 * @typedef {object} CachedPrefix
		 * @property {number} length The length of the prefix
		 * @property {RegExp | null} regex The RegExp for the prefix
		 */

		/**
		 * @param {...*} args Normal D.JS Message args
		 */
		constructor(...args) {
			super(...args);

			/**
			 * The command being run
			 * @since 0.0.1
			 * @type {?Command}
			 */
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
			if (!this.prompter && this.command) {
				this.prompter = new CommandPrompt(this, this.command, { flagSupport: true });
			}
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
			const { permission } = await this.client.permissionLevels.run(this, min);
			return permission;
		}

		/**
		 * Since d.js is dumb and has 2 patch methods, this is for edits
		 * @since 0.5.0
		 * @param {*} data The data passed from the original constructor
		 * @private
		 */
		patch(data) {
			super.patch(data);
			this.language = this.client.languages.default;
			this._parseCommand();
		}

		/**
		 * Extends the patch method from D.JS to attach and update the language to this instance
		 * @since 0.5.0
		 * @param {*} data The data passed from the original constructor
		 * @private
		 */
		_patch(data) {
			super._patch(data);

			/**
			 * The language in this setting
			 * @since 0.3.0
			 * @type {Language}
			 */
			this.language = this.client.languages.default;

			this._parseCommand();
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
				this.commandText = this.content.slice(prefix.length).trim().split(' ')[0].toLowerCase();
				this.command = this.client.commands.get(this.commandText) || null;

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
			const settings = this.guild.client.gateways.get('guilds').get(this.guild.id);
			if (!settings) return null;
			const prefix = settings.get('prefix');
			if (!prefix || !prefix.length) return null;
			const testingPrefix = this.constructor.prefixes.get(prefix) || this.constructor.generateNewPrefix(prefix);
			if (testingPrefix.regex.test(this.content)) return testingPrefix;
			return null;
		}

		/**
		 * Checks if the mention was used as a prefix
		 * @since 0.5.0
		 * @returns {CachedPrefix | null}
		 * @private
		 */
		_mentionPrefix() {
			const mentionPrefix = this.client.mentionPrefix.exec(this.content);
			return mentionPrefix ? { length: mentionPrefix[0].length, regex: this.client.mentionPrefix } : null;
		}

		/**
		 * Checks if a prefixless scenario is possible
		 * @since 0.5.0
		 * @returns {CachedPrefix | null}
		 * @private
		 */
		_prefixLess() {
			return this.client.options.noPrefixDM && this.channel.type === 'dm' ? { length: 0, regex: null } : null;
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

	return KlasaMessage;
});
