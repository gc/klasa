const Discord = require('discord.js');
const { Permissions } = Discord;
const path = require('path');


// lib/structures
const ArgumentStore = require('./structures/ArgumentStore');
const CommandStore = require('./structures/CommandStore');
const EventStore = require('./structures/EventStore');
const ExtendableStore = require('./structures/ExtendableStore');
const FinalizerStore = require('./structures/FinalizerStore');
const LanguageStore = require('./structures/LanguageStore');
const MonitorStore = require('./structures/MonitorStore');
const TaskStore = require('./structures/TaskStore');

// lib/util
const KlasaConsole = require('./util/KlasaConsole');
const { DEFAULTS, MENTION_REGEX } = require('./util/constants');
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

	/**
	 * Defaulted as `Successfully initialized. Ready to serve ${this.guilds.size} guilds.`
	 * @typedef {(string|Function)} ReadyMessage
	 */

	/**
	 * @typedef {external:DiscordClientOptions} KlasaClientOptions
	 * @property {boolean} [commandEditing=false] Whether the bot should update responses if the command is edited
	 * @property {boolean} [commandLogging=false] Whether the bot should log command usage
	 * @property {number} [commandMessageLifetime=1800] The threshold for how old command messages can be before sweeping since the last edit in seconds
	 * @property {ConsoleOptions} [console={}] Config options to pass to the client console
	 * @property {ConsoleEvents} [consoleEvents={}] Config options to pass to the client console
	 * @property {CustomPromptDefaults} [customPromptDefaults={}] The defaults for custom prompts
	 * @property {string[]} [disabledCorePieces=[]] An array of disabled core piece types, e.g., ['commands', 'arguments']
	 * @property {string} [language='en-US'] The default language Klasa should opt-in for the commands
	 * @property {boolean} [noPrefixDM=false] Whether the bot should allow prefixless messages in DMs
	 * @property {string[]} [owners] The discord user id for the users the bot should respect as the owner (gotten from Discord api if not provided)
	 * @property {PieceDefaults} [pieceDefaults={}] Overrides the defaults for all pieces
	 * @property {string|string[]} [prefix] The default prefix the bot should respond to
	 * @property {boolean} [production=false] Whether the bot should handle unhandled promise rejections automatically (handles when false) (also can be configured with process.env.NODE_ENV)
	 * @property {ProvidersOptions} [providers] The provider options
	 * @property {ReadyMessage} [readyMessage] readyMessage to be passed throughout Klasa's ready event
	 * @property {RegExp} [regexPrefix] The regular expression prefix if one is provided
	 * @property {number} [slowmode=0] Amount of time in ms before the bot will respond to a users command since the last command that user has run
	 * @property {boolean} [slowmodeAggressive=false] If the slowmode time should reset if a user spams commands faster than the slowmode allows for
	 * @property {boolean} [typing=false] Whether the bot should type while processing commands
	 * @property {SettingsOptions} [settings] The setting's options
	 */

	/**
	 * @typedef {Object} ProvidersOptions
	 * @property {string} [default] The default provider to use
	 */

	/**
	 * @typedef {Object} SettingsOptions
	 * @property {boolean} [throwOnError=false] Whether settings updates and resets should throw their errors or not
	 * @property {boolean} [preserve=true] Whether the bot should preserve (non-default) settings when removed from a guild
	 * @property {GatewayOptions} [gateways={}] The options for each built-in gateway
	 */

	/**
	 * @typedef {Object} GatewaysOptions
	 * @property {GatewayDriverRegisterOptions} [clientStorage] The options for clientStorage's gateway
	 * @property {GatewayDriverRegisterOptions} [guilds] The options for guilds' gateway
	 * @property {GatewayDriverRegisterOptions} [users] The options for users' gateway
	 */

	/**
	 * @typedef {Object} ConsoleEvents
	 * @property {boolean} [debug=false] If the debug event should be enabled by default
	 * @property {boolean} [error=true] If the error event should be enabled by default
	 * @property {boolean} [log=true] If the log event should be enabled by default
	 * @property {boolean} [verbose=false] If the verbose event should be enabled by default
	 * @property {boolean} [warn=true] If the warn event should be enabled by default
	 * @property {boolean} [wtf=true] If the wtf event should be enabled by default
	 */

	/**
	 * @typedef {Object} PieceDefaults
	 * @property {CommandOptions} [commands={}] The default command options
	 * @property {EventOptions} [events={}] The default event options
	 * @property {ExtendableOptions} [extendables={}] The default extendable options
	 * @property {FinalizerOptions} [finalizers={}] The default finalizer options
	 * @property {LanguageOptions} [languages={}] The default language options
	 * @property {MonitorOptions} [monitors={}] The default monitor options
	 * @property {ProviderOptions} [providers={}] The default provider options
	 */

	/**
	 * @typedef {Object} CustomPromptDefaults
	 * @property {number} [limit=Infinity] The number of re-prompts before custom prompt gives up
	 * @property {number} [time=30000] The time-limit for re-prompting custom prompts
	 * @property {boolean} [quotedStringSupport=false] Whether the custom prompt should respect quoted strings
	 */

	/**
	 * Constructs the Klasa client
	 * @since 0.0.1
	 * @param {KlasaClientOptions} [options={}] The config to pass to the new client
	 */
	constructor(options = {}) {
		if (!util.isObject(options)) throw new TypeError('The Client Options for Klasa must be an object.');
		options = util.mergeDefault(DEFAULTS.CLIENT, options);
		super(options);

		// Requiring here to avoid circular dependencies
		const { SerializerStore, ProviderStore, GatewayDriver } = require('@klasa/settings-gateway');

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
		 * The cache where argument resolvers are stored
		 * @since 0.5.0
		 * @type {ArgumentStore}
		 */
		this.arguments = new ArgumentStore(this);

		/**
		 * The cache where commands are stored
		 * @since 0.0.1
		 * @type {CommandStore}
		 */
		this.commands = new CommandStore(this);


		/**
		 * The cache where finalizers are stored
		 * @since 0.0.1
		 * @type {FinalizerStore}
		 */
		this.finalizers = new FinalizerStore(this);

		/**
		 * The cache where monitors are stored
		 * @since 0.0.1
		 * @type {MonitorStore}
		 */
		this.monitors = new MonitorStore(this);

		/**
		 * The cache where languages are stored
		 * @since 0.2.1
		 * @type {LanguageStore}
		 */
		this.languages = new LanguageStore(this);

		/**
		 * The cache where providers are stored
		 * @since 0.0.1
		 * @type {ProviderStore}
		 */
		this.providers = new ProviderStore(this);

		/**
		 * The cache where events are stored
		 * @since 0.0.1
		 * @type {EventStore}
		 */
		this.events = new EventStore(this);

		/**
		 * The cache where extendables are stored
		 * @since 0.0.1
		 * @type {ExtendableStore}
		 */
		this.extendables = new ExtendableStore(this);

		/**
		 * The cache where tasks are stored
		 * @since 0.5.0
		 * @type {TaskStore}
		 */
		this.tasks = new TaskStore(this);

		/**
		 * The Serializers where serializers are stored
		 * @since 0.5.0
		 * @type {SerializerStore}
		 */
		this.serializers = new SerializerStore(this);

		/**
		 * A Store registry
		 * @since 0.3.0
		 * @type {external:Collection}
		 */
		this.pieceStores = new Discord.Collection();

		/**
		 * The GatewayDriver instance where the gateways are stored
		 * @since 0.5.0
		 * @type {GatewayDriver}
		 */
		this.gateways = new GatewayDriver(this);

		/**
		 * The Settings instance that handles this client's settings
		 * @since 0.5.0
		 * @type {?Settings}
		 */
		this.settings = null;

		this.registerStore(this.commands)
			.registerStore(this.finalizers)
			.registerStore(this.monitors)
			.registerStore(this.languages)
			.registerStore(this.providers)
			.registerStore(this.events)
			.registerStore(this.extendables)
			.registerStore(this.tasks)
			.registerStore(this.arguments)
			.registerStore(this.serializers);

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

		this.constructor.registerGateways(this);

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

		// Providers must be init before settings, and those before all other stores.
		await this.providers.init();
		await this.gateways.init();

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

	/**
	 * Register all built-in gateways
	 * @since 0.5.0
	 * @param {KlasaClient} client The client to register the gateways into
	 * @private
	 */
	static registerGateways(client) {
		const { Gateway } = require('@klasa/settings-gateway');

		// Setup default gateways and adjust client options as necessary
		const { guilds, users, clientStorage } = client.options.settings.gateways;
		guilds.schema = 'schema' in guilds ? guilds.schema : client.constructor.defaultGuildSchema;
		users.schema = 'schema' in users ? users.schema : client.constructor.defaultUserSchema;
		clientStorage.schema = 'schema' in clientStorage ? clientStorage.schema : client.constructor.defaultClientSchema;

		const prefix = guilds.schema.get('prefix');
		const language = guilds.schema.get('language');

		if (!prefix || prefix.default === null) {
			guilds.schema.add('prefix', 'string', { array: Array.isArray(client.options.prefix), default: client.options.prefix });
		}

		if (!language || language.default === null) {
			guilds.schema.add('language', 'language', { default: client.options.language });
		}

		client.gateways
			.register(new Gateway(client, 'guilds', guilds))
			.register(new Gateway(client, 'users', users))
			.register(new Gateway(client, 'clientStorage', clientStorage));
	}

}

module.exports = KlasaClient;

/**
 * The plugin symbol to be used in external packages
 * @since 0.5.0
 * @type {Symbol}
 */
KlasaClient.plugin = Symbol('KlasaPlugin');

/**
 * The base Permissions that the {@link Client#invite} asks for. Defaults to [VIEW_CHANNEL, SEND_MESSAGES]
 * @since 0.5.0
 * @type {Permissions}
 */
KlasaClient.basePermissions = new Permissions(['VIEW_CHANNEL', 'SEND_MESSAGES']);


// Requiring here to avoid circular dependencies
const { Schema } = require('@klasa/settings-gateway/dist/lib/schema/Schema');

/**
 * The default Guild Schema
 * @since 0.5.0
 * @type {Schema}
 */
KlasaClient.defaultGuildSchema = new Schema()
	.add('prefix', 'string')
	.add('language', 'language')
	.add('disabledCommands', 'command', {
		array: true,
		filter: (client, command, { language }) => {
			if (command.guarded) throw language.get('COMMAND_CONF_GUARDED', command.name);
		}
	});

/**
 * The default User Schema
 * @since 0.5.0
 * @type {Schema}
 */
KlasaClient.defaultUserSchema = new Schema();

/**
 * The default Client Schema
 * @since 0.5.0
 * @type {Schema}
 */
KlasaClient.defaultClientSchema = new Schema()
	.add('userBlacklist', 'user', { array: true })
	.add('guildBlacklist', 'string', { array: true, filter: (__, value) => !MENTION_REGEX.snowflake.test(value) });

/**
 * Emitted when Klasa is fully ready and initialized.
 * @event KlasaClient#klasaReady
 * @since 0.3.0
 */

/**
 * A central logging event for Klasa.
 * @event KlasaClient#log
 * @since 0.3.0
 * @param {(string|Object)} data The data to log
 */

/**
 * An event for handling verbose logs
 * @event KlasaClient#verbose
 * @since 0.4.0
 * @param {(string|Object)} data The data to log
 */

/**
 * An event for handling wtf logs (what a terrible failure)
 * @event KlasaClient#wtf
 * @since 0.4.0
 * @param {(string|Object)} data The data to log
 */

/**
 * Emitted when an event has encountered an error.
 * @event KlasaClient#eventError
 * @since 0.5.0
 * @param {Event} event The event that errored
 * @param {any[]} args The event arguments
 * @param {(string|Object)} error The event error
 */

/**
 * Emitted when a monitor has encountered an error.
 * @event KlasaClient#monitorError
 * @since 0.4.0
 * @param {KlasaMessage} message The message that triggered the monitor
 * @param {Monitor} monitor The monitor run
 * @param {(Error|string)} error The monitor error
 */

/**
 * Emitted when a finalizer has encountered an error.
 * @event KlasaClient#finalizerError
 * @since 0.5.0
 * @param {KlasaMessage} message The message that triggered the finalizer
 * @param {Command} command The command this finalizer is for (may be different than message.command)
 * @param {KlasaMessage|any} response The response from the command
 * @param {Stopwatch} timer The timer run from start to queue of the command
 * @param {Finalizer} finalizer The finalizer run
 * @param {(Error|string)} error The finalizer error
 */

/**
 * Emitted when a task has encountered an error.
 * @event KlasaClient#taskError
 * @since 0.5.0
 * @param {ScheduledTask} scheduledTask The scheduled task
 * @param {Task} task The task run
 * @param {(Error|string)} error The task error
 */

/**
 * Emitted when a {@link Settings} instance synchronizes with the database.
 * @event KlasaClient#settingsSync
 * @since 0.5.0
 * @param {Settings} entry The patched Settings instance
 */

/**
 * Emitted when {@link Settings#update} or {@link Settings#reset} is run.
 * @event KlasaClient#settingsUpdate
 * @since 0.5.0
 * @param {Settings} entry The patched Settings instance
 * @param {SettingsUpdateResultEntry[]} changes The keys that were updated
 */

/**
 * Emitted when {@link Settings#destroy} is run.
 * @event KlasaClient#settingsDelete
 * @since 0.5.0
 * @param {Settings} entry The entry which got deleted
 */

/**
 * Emitted when a new entry in the database has been created upon update.
 * @event KlasaClient#settingsCreate
 * @since 0.5.0
 * @param {Settings} entry The entry which got created
 */

/**
 * Emitted when a piece is loaded. (This can be spammy on bot startup or anytime you reload all of a piece type.)
 * @event KlasaClient#pieceLoaded
 * @since 0.4.0
 * @param {Piece} piece The piece that was loaded
 */

/**
 * Emitted when a piece is unloaded.
 * @event KlasaClient#pieceUnloaded
 * @since 0.4.0
 * @param {Piece} piece The piece that was unloaded
 */

/**
 * Emitted when a piece is reloaded.
 * @event KlasaClient#pieceReloaded
 * @since 0.4.0
 * @param {Piece} piece The piece that was reloaded
 */

/**
 * Emitted when a piece is enabled.
 * @event KlasaClient#pieceEnabled
 * @since 0.4.0
 * @param {Piece} piece The piece that was enabled
 */

/**
 * Emitted when a piece is disabled.
 * @event KlasaClient#pieceDisabled
 * @since 0.4.0
 * @param {Piece} piece The piece that was disabled
 */
