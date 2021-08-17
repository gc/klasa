const { Structures, Collection, Permissions: { FLAGS } } = require('discord.js');
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

			/**
			 * The responses to this message
			 * @since 0.5.0
			 * @type {external:KlasaMessage[]}
			 * @private
			 */
			this._responses = [];
		}

		/**
		 * The previous responses to this message
		 * @since 0.5.0
		 * @type {KlasaMessage[]}
		 * @readonly
		 */
		get responses() {
			return this._responses.filter(msg => !msg.deleted);
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
		 * If this message can be reacted to by the bot
		 * @since 0.0.1
		 * @type {boolean}
		 * @readonly
		 */
		get reactable() {
			if (!this.guild) return true;
			return this.channel.readable && this.channel.permissionsFor(this.guild.me).has([FLAGS.ADD_REACTIONS, FLAGS.READ_MESSAGE_HISTORY], false);
		}

		/**
		 * The usable commands by the author in this message's context
		 * @since 0.0.1
		 * @returns {Collection<string, Command>} The filtered CommandStore
		 */
		async usableCommands() {
			const col = new Collection();
			await Promise.all(this.client.commands.map((command) =>
				this.client.inhibitors.run(this, command, true)
					.then(() => { col.set(command.name, command); })
					.catch(() => {
						// noop
					})
			));
			return col;
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
		 * Sends a message that will be editable via command editing (if nothing is attached)
		 * @since 0.0.1
		 * @param {external:StringResolvable|external:MessageEmbed|external:MessageAttachment} [content] The content to send
		 * @param {external:MessageOptions} [options] The D.JS message options
		 * @returns {Promise<KlasaMessage|KlasaMessage[]>}
		 */
		send(content, options) {
			return this.channel.send({ ...options, content });
		}

		/**
		 * Since d.js is dumb and has 2 patch methods, this is for edits
		 * @since 0.5.0
		 * @param {*} data The data passed from the original constructor
		 * @private
		 */
		patch(data) {
			super.patch(data);
			this.language = this.guild ? this.guild.language : this.client.languages.default;
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
			this.language = this.guild ? this.guild.language : this.client.languages.default;

			this._parseCommand();
		}

		/**
		 * Parses this message as a command
		 * @since 0.5.0
		 * @private
		 */
		async _parseCommand() {
			// Clear existing command state so edits to non-commands do not re-run commands
			this.prefix = null;
			this.prefixLength = null;
			this.commandText = null;
			this.command = null;
			this.prompter = null;

			try {
				const prefix = await this._customPrefix() || this._mentionPrefix() || this._naturalPrefix() || this._prefixLess();
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
		async _customPrefix() {
			const settings = await this.guild.client.gateways.get('guilds').acquire(this.guild);
			const prefix = settings.get('prefix');
			if (!prefix || !prefix.length) return null;
			for (const prf of Array.isArray(prefix) ? prefix : [prefix]) {
				const testingPrefix = this.constructor.prefixes.get(prf) || this.constructor.generateNewPrefix(prf, this.client.options.prefixCaseInsensitive ? 'i' : '');
				if (testingPrefix.regex.test(this.content)) return testingPrefix;
			}
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
		 * Checks if the natural prefix is used
		 * @since 0.5.0
		 * @returns {CachedPrefix | null}
		 * @private
		 */
		_naturalPrefix() {
			const settings = this.guild.client.gateways.get('guilds').get(this.guild);
			if (!settings) return null;
			if (settings.get('disableNaturalPrefix') || !this.client.options.regexPrefix) return null;
			const results = this.client.options.regexPrefix.exec(this.content);
			return results ? { length: results[0].length, regex: this.client.options.regexPrefix } : null;
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
		 * @param {string} flags The flags for the RegExp
		 * @returns {CachedPrefix}
		 * @private
		 */
		static generateNewPrefix(prefix, flags) {
			const prefixObject = { length: prefix.length, regex: new RegExp(`^${regExpEsc(prefix)}`, flags) };
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
