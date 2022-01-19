const { mergeDefault, isObject } = require('./util');

const colorBase = {
	shard: { background: 'cyan', text: 'black' },
	message: {},
	time: {}
};

exports.DEFAULTS = {

	CLIENT: {
		commandEditing: false,
		commandLogging: false,
		commandMessageLifetime: 1800,
		console: {},
		consoleEvents: {
			debug: false,
			error: true,
			log: true,
			verbose: false,
			warn: true,
			wtf: true
		},
		disabledCorePieces: [],
		language: 'en-US',
		noPrefixDM: false,
		prefix: '',
		readyMessage: (client) => `Successfully initialized. Ready to serve ${client.guilds.size} guild${client.guilds.size === 1 ? '' : 's'}.`,
		typing: false,
		customPromptDefaults: {
			time: 30000,
			limit: Infinity,
			quotedStringSupport: false,
			flagSupport: true
		},
		owners: [],
		// eslint-disable-next-line no-process-env
		production: process.env.NODE_ENV === 'production',
		providers: { default: 'json' },
		pieceDefaults: {
			arguments: {
				enabled: true,
				aliases: []
			},
			commands: {
				aliases: [],
				autoAliases: true,
				bucket: 1,
				cooldown: 0,
				cooldownLevel: 'author',
				description: '',
				extendedHelp: language => language.get('COMMAND_HELP_NO_EXTENDED'),
				enabled: true,
				flagSupport: true,
				guarded: false,
				hidden: false,
				nsfw: false,
				promptLimit: 0,
				promptTime: 30000,
				runIn: ['text', 'dm'],
				subcommands: false,
				usage: '',
				quotedStringSupport: false,
				deletable: false
			},
			events: {
				enabled: true,
				once: false
			},
			extendables: {
				enabled: true,
				klasa: false,
				appliesTo: []
			},
			finalizers: { enabled: true },
			languages: { enabled: true },
			monitors: {
				enabled: true,
				ignoreBots: true,
				ignoreSelf: true,
				ignoreOthers: true,
				ignoreWebhooks: true,
				ignoreEdits: true,
				allowedTypes: ['DEFAULT']
			},
			providers: { enabled: true },
			serializers: {
				enabled: true,
				aliases: []
			},
			tasks: { enabled: true }
		},
		slowmode: 0,
		slowmodeAggressive: false,
		settings: {
			preserve: true,
			throwOnError: false,
			gateways: {
				guilds: {},
				users: {},
				clientStorage: {}
			}
		}
	},

	CONSOLE: {
		stdout: process.stdout,
		stderr: process.stderr,
		timestamps: true,
		utc: false,
		types: {
			debug: 'log',
			error: 'error',
			log: 'log',
			verbose: 'log',
			warn: 'warn',
			wtf: 'error'
		},
		colors: {
			debug: mergeDefault(colorBase, { time: { background: 'magenta' } }),
			error: mergeDefault(colorBase, { time: { background: 'red' } }),
			log: mergeDefault(colorBase, { time: { background: 'blue' } }),
			verbose: mergeDefault(colorBase, { time: { text: 'gray' } }),
			warn: mergeDefault(colorBase, { time: { background: 'lightyellow', text: 'black' } }),
			wtf: mergeDefault(colorBase, { message: { text: 'red' }, time: { background: 'red' } })
		}
	},

	QUERYBUILDER: {
		datatypes: [
			['any', { type: 'TEXT' }],
			['json', { type: 'JSON', serializer: (value) => `'${JSON.stringify(value).replace(/'/g, "''")}'` }],
			['boolean', { type: 'BOOLEAN', serializer: value => value }],
			['bool', { extends: 'boolean' }],
			['snowflake', { type: 'VARCHAR(19)' }],
			['channel', { extends: 'snowflake' }],
			['textchannel', { extends: 'channel' }],
			['voicechannel', { extends: 'channel' }],
			['categorychannel', { extends: 'channel' }],
			['guild', { extends: 'snowflake' }],
			['number', { type: 'FLOAT', serializer: value => value }],
			['float', { extends: 'number' }],
			['integer', { extends: 'number', type: 'INTEGER' }],
			['command', { type: 'TEXT' }],
			['language', { type: 'VARCHAR(5)' }],
			['role', { extends: 'snowflake' }],
			['string', { type: ({ max }) => max ? `VARCHAR(${max})` : 'TEXT' }],
			['url', { type: 'TEXT' }],
			['user', { extends: 'snowflake' }]
		],
		queryBuilderOptions: {
			array: () => 'TEXT',
			arraySerializer: (values) => `'${JSON.stringify(values)}'`,
			formatDatatype: (name, datatype, def = null) => `${name} ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`,
			serializer: (value) => `'${(isObject(value) ? JSON.stringify(value) : String(value)).replace(/'/g, "''")}'`
		}
	}

};

exports.TIME = {
	SECOND: 1000,
	MINUTE: 1000 * 60,
	HOUR: 1000 * 60 * 60,
	DAY: 1000 * 60 * 60 * 24,

	DAYS: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

	TIMESTAMP: {
		TOKENS: new Map([
			['Y', 4],
			['Q', 1],
			['M', 4],
			['D', 4],
			['d', 4],
			['X', 1],
			['x', 1],
			['H', 2],
			['h', 2],
			['a', 1],
			['A', 1],
			['m', 2],
			['s', 2],
			['S', 3],
			['Z', 2],
			['l', 4],
			['L', 4],
			['T', 1],
			['t', 1]
		])
	}
};

exports.MENTION_REGEX = {
	userOrMember: /^(?:<@!?)?(\d{17,19})>?$/,
	channel: /^(?:<#)?(\d{17,19})>?$/,
	emoji: /^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/,
	role: /^(?:<@&)?(\d{17,19})>?$/,
	snowflake: /^(\d{17,19})$/
};
