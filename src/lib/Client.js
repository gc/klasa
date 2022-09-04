const Discord = require('discord.js');
const path = require('path');


// lib/structures
const EventStore = require('./structures/EventStore');
const LanguageStore = require('./structures/LanguageStore');
const TaskStore = require('./structures/TaskStore');

// lib/util
const KlasaConsole = require('./util/KlasaConsole');
const { DEFAULTS } = require('./util/constants');
const Stopwatch = require('./util/Stopwatch');
const util = require('./util/util');

// external plugins
const plugins = new Set();

/**
 * The client for handling everything. See {@tutorial GettingStarted} for more information how to get started using this class.
 * @extends external:Client
 * @tutorial GettingStarted
 */
class KlasaClient extends Discord.Client {

	constructor(options = {}) {
		if (!util.isObject(options)) throw new TypeError('The Client Options for Klasa must be an object.');
		options = util.mergeDefault(DEFAULTS.CLIENT, options);
		super(options);

		/**
		 * The options the client was instantiated with.
		 * @since 0.5.0
		 * @name KlasaClient#options
		 * @type {KlasaClientOptions}
		 */

		/**
		 * The directory where the user files are at
		 * @since 0.0.1
		 * @type {string}
		 */
		this.userBaseDirectory = require.main ? path.dirname(require.main.filename) : null;

		/**
		 * The console for this instance of klasa. You can disable timestamps, colors, and add writable streams as configuration options to configure this.
		 * @since 0.4.0
		 * @type {KlasaConsole}
		 */
		this.console = new KlasaConsole(this.options.console);

		/**
		 * The cache where languages are stored
		 * @since 0.2.1
		 * @type {LanguageStore}
		 */
		this.languages = new LanguageStore(this);

		/**
		 * The cache where events are stored
		 * @since 0.0.1
		 * @type {EventStore}
		 */
		this.events = new EventStore(this);

		/**
		 * The cache where tasks are stored
		 * @since 0.5.0
		 * @type {TaskStore}
		 */
		this.tasks = new TaskStore(this);

		/**
		 * A Store registry
		 * @since 0.3.0
		 * @type {external:Collection}
		 */
		this.pieceStores = new Discord.Collection();

		this
			.registerStore(this.languages)
			.registerStore(this.events)
			.registerStore(this.tasks);

		const coreDirectory = path.join(__dirname, '../');
		for (const store of this.pieceStores.values()) store.registerCoreDirectory(coreDirectory);

		/**
		 * Whether the client is truly ready or not
		 * @since 0.0.1
		 * @type {boolean}
		 */
		this.ready = false;

		/**
		 * The regexp for a prefix mention
		 * @since 0.5.0
		 * @type {RegExp}
		 */
		this.mentionPrefix = null;

		// Run all plugin functions in this context
		for (const plugin of plugins) plugin.call(this);
	}

	/**
	 * The owners for this bot
	 * @since 0.5.0
	 * @type {Set<KlasaUser>}
	 * @readonly
	 */
	get owners() {
		const owners = new Set();
		for (const owner of this.options.owners) {
			const user = this.users.cache.get(owner);
			if (user) owners.add(user);
		}
		return owners;
	}

	/**
	 * Registers a custom store to the client
	 * @since 0.3.0
	 * @param {Store} store The store that pieces will be stored in
	 * @returns {this}
	 * @chainable
	 */
	registerStore(store) {
		this.pieceStores.set(store.name, store);
		return this;
	}

	/**
	 * Un-registers a custom store from the client
	 * @since 0.3.0
	 * @param {Store} storeName The store that pieces will be stored in
	 * @returns {this}
	 * @chainable
	 */
	unregisterStore(storeName) {
		this.pieceStores.delete(storeName);
		return this;
	}

	/**
	 * Use this to login to Discord with your bot
	 * @since 0.0.1
	 * @param {string} token Your bot token
	 * @returns {string}
	 */
	async login(token) {
		const timer = new Stopwatch();
		const loaded = await Promise.all(this.pieceStores.map(async store => `Loaded ${await store.loadAll()} ${store.name}.`))
			.catch((err) => {
				console.error(err);
				process.exit();
			});
		this.emit('log', loaded.join('\n'));


		this.emit('log', `Loaded in ${timer.stop()}.`);
		return super.login(token);
	}

	/**
	 * Caches a plugin module to be used when creating a KlasaClient instance
	 * @since 0.5.0
	 * @param {Object} mod The module of the plugin to use
	 * @returns {this}
	 * @chainable
	 */
	static use(mod) {
		const plugin = mod[this.plugin];
		if (!util.isFunction(plugin)) throw new TypeError('The provided module does not include a plugin function');
		plugins.add(plugin);
		return this;
	}

}

module.exports = KlasaClient;

/**
 * The plugin symbol to be used in external packages
 * @since 0.5.0
 * @type {Symbol}
 */
KlasaClient.plugin = Symbol('KlasaPlugin');
