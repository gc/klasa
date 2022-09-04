/// <reference types="node" />

declare module 'klasa' {

	import { ExecOptions } from 'child_process';

	import {
		APIMessage,
		Channel,
		Client,
		ClientOptions,
		Collection,
		DMChannel,
		Guild,
		GuildMember,
		GuildResolvable,
		Message,
		MessageAdditions,
		MessageOptions,
		MessageType,
		PermissionResolvable,
		Permissions,
		Role,
		Snowflake,
		StringResolvable,
		TextChannel,
		User,
		UserStore
	} from 'discord.js';

	import {
		Schema,
		GatewayStorageOptions,
		Settings
	} from '@klasa/settings-gateway';

	export const version: string;

//#region Classes

	export class KlasaClient extends Client {
		public constructor(options?: KlasaClientOptions);
		public login(token?: string): Promise<string>;

		public static defaultGuildSchema: Schema;
		public static defaultUserSchema: Schema;
		public static defaultClientSchema: Schema;
		public static plugin: symbol;
		public static use(mod: any): typeof KlasaClient;
	}

	export { KlasaClient as Client };

//#region Parsers

	export class Resolver {
		public constructor(client: KlasaClient);
		public readonly client: KlasaClient;

		public boolean(input: boolean | string): Promise<boolean>;
		public channel(input: Channel | Snowflake): Promise<Channel>;
		public float(input: string | number): Promise<number>;
		public guild(input: Guild | Snowflake): Promise<Guild>;
		public integer(input: string | number): Promise<number>;
		public member(input: KlasaUser | GuildMember | Snowflake, guild: Guild): Promise<GuildMember>;
		public message(input: KlasaMessage | Snowflake, channel: Channel): Promise<KlasaMessage>;
		public role(input: Role | Snowflake, guild: Guild): Promise<Role>;
		public string(input: string): Promise<string>;
		public url(input: string): Promise<string>;
		public user(input: KlasaUser | GuildMember | KlasaMessage | Snowflake): Promise<KlasaUser>;

		public static readonly regex: {
			userOrMember: RegExp,
			channel: RegExp,
			role: RegExp,
			snowflake: RegExp
		};
	}

//#endregion Parsers

//#region Pieces

	export abstract class Piece {
		public constructor(store: Store<string, Piece, typeof Piece>, file: string[], directory: string, options?: PieceOptions);
		public readonly client: KlasaClient;
		public readonly type: string;
		public readonly path: string;
		public file: string[];
		public name: string;
		public enabled: boolean;
		public store: Store<string, this>;
		public directory: string;

		public reload(): Promise<this>;
		public unload(): void;
		public enable(): this;
		public disable(): this;
		public init(): Promise<any>;
		public toJSON(): PieceJSON;
		public toString(): string;
	}

	export abstract class AliasPiece extends Piece {
		public constructor(store: Store<string, Piece, typeof Piece>, file: string[], directory: string, options?: AliasPieceOptions);
		public aliases: Array<string>;
		public toJSON(): AliasPieceJSON;
	}


	export abstract class Event extends Piece {
		public constructor(store: EventStore, file: string[], directory: string, options?: EventOptions);
		public emitter: NodeJS.EventEmitter;
		public event: string;
		public once: boolean;
		private _listener: Function;

		public abstract run(...params: any[]): void;
		public toJSON(): PieceEventJSON;

		private _run(param: any): void;
		private _runOnce(...args: any[]): Promise<void>;
		private _listen(): void;
		private _unlisten(): void;
	}

	export abstract class Language extends Piece {
		public constructor(store: LanguageStore, file: string[], directory: string, options?: LanguageOptions);
		public language: Record<string, string | string[] | ((...args: any[]) => string | string[])>;

		public get<T = string, A extends readonly unknown[] = readonly unknown[]>(term: string, ...args: A): T;
		public toJSON(): PieceLanguageJSON;
	}

	export abstract class Monitor extends Piece {
		public constructor(store: MonitorStore, file: string[], directory: string, options?: MonitorOptions);
		public allowedTypes: MessageType[];
		public ignoreBots: boolean;
		public ignoreEdits: boolean;
		public ignoreOthers: boolean;
		public ignoreSelf: boolean;
		public ignoreWebhooks: boolean;

		public abstract run(message: KlasaMessage): void;
		public shouldRun(message: KlasaMessage): boolean;
		public toJSON(): PieceMonitorJSON;
		protected _run(message: KlasaMessage): Promise<void>;
	}

	export abstract class Task extends Piece {
		public constructor(store: TaskStore, file: string[], directory: string, options?: TaskOptions);
		public abstract run(data?: any): unknown;
		public toJSON(): PieceTaskJSON;
	}

//#endregion Pieces

//#region Stores

	export abstract class Store<K, V extends Piece, VConstructor = Constructor<V>> extends Collection<K, V> {
		public constructor(client: KlasaClient, name: string, holds: VConstructor);
		public readonly client: KlasaClient;
		public readonly holds: VConstructor;
		public readonly name: string;
		public readonly userDirectory: string;
		private readonly coreDirectories: Set<string>;

		protected registerCoreDirectory(directory: string): this;
		public delete(name: K | V): boolean;
		public get(key: K): V | undefined;
		public get<T extends V>(key: K): T | undefined;
		public init(): Promise<any[]>;
		public load(directory: string, file: string[]): V;
		public loadAll(): Promise<number>;
		public resolve(name: V | string): V;
		public set<T extends V>(key: K, value: T): this;
		public set(piece: V): V;
		public toString(): string;

		private static walk<K, V extends Piece, T extends Store<K, V>>(store: T, coreDirectory?: string): Promise<Array<Piece>>;
	}

	export abstract class AliasStore<K, V extends Piece, VConstructor = Constructor<V>> extends Store<K, V, VConstructor> {
		public aliases: Collection<K, V>;
	}

	export class EventStore extends Store<string, Event, typeof Event> {
		private _onceEvents: Set<string>;
	}

	export class LanguageStore extends Store<string, Language, typeof Language> {
		public readonly default: Language;
	}

	export class MonitorStore extends Store<string, Monitor, typeof Monitor> {
		public run(message: KlasaMessage): Promise<void>;
	}

	export class TaskStore extends Store<string, Task, typeof Task> { }

//#endregion Stores

//#region Util

	export class Colors {
		public constructor(options?: ColorsFormatOptions);
		public opening: string;
		public closing: string;

		public format(input: string): string;
		public static useColors: boolean | null;
		public static CLOSE: typeof ColorsClose;
		public static STYLES: typeof ColorsStyleTypes;
		public static TEXTS: typeof ColorsTexts;
		public static BACKGROUNDS: typeof ColorsBackgrounds;
		public static hexToRGB(hex: string): number[];
		public static hueToRGB(p: number, q: number, t: number): number;
		public static hslToRGB([h, s, l]: [number | string, number | string, number | string]): number[];
		public static formatArray([pos1, pos2, pos3]: [number | string, number | string, number | string]): string;

		private static style(styles: string | string[], data?: ColorsFormatData): ColorsFormatData;
		private static background(style: ColorsFormatType, data?: ColorsFormatData): ColorsFormatData;
		private static text(style: ColorsFormatType, data?: ColorsFormatData): ColorsFormatData;

	}

	export const constants: Constants;

	export class Duration {
		public constructor(pattern: string);
		public offset: number;
		public readonly fromNow: Date;

		public dateFrom(date: Date): Date;

		public static toNow(earlier: Date | number | string, showIn?: boolean): string;

		private static regex: RegExp;
		private static commas: RegExp;
		private static aan: RegExp;

		private static _parse(pattern: string): number;
	}

	export class KlasaConsole {
		private constructor(options?: ConsoleOptions);
		public readonly stdout: NodeJS.WritableStream;
		public readonly stderr: NodeJS.WritableStream;
		public template: Timestamp | null;
		public colors: ConsoleColorStyles;
		public utc: boolean;

		private readonly timestamp: string;

		private write(data: any[], type?: string): void;

		public log(...data: any[]): void;
		public warn(...data: any[]): void;
		public error(...data: any[]): void;
		public debug(...data: any[]): void;
		public verbose(...data: any[]): void;
		public wtf(...data: any[]): void;

		private static _flatten(data: any): string;
	}

	export class RateLimit {
		public constructor(bucket: number, cooldown: number);
		public readonly expired: boolean;
		public readonly limited: boolean;
		public readonly remainingTime: number;
		public bucket: number;
		public cooldown: number;
		private remaining: number;
		private time: number;
		public drip(): this;
		public reset(): this;
		public resetRemaining(): this;
		public resetTime(): this;
	}

	export class RateLimitManager<K = Snowflake> extends Collection<K, RateLimit> {
		public constructor(bucket: number, cooldown: number);
		public bucket: number;
		public cooldown: number;
		private _bucket: number;
		private _cooldown: number;
		private sweepInterval: NodeJS.Timer | null;
		public acquire(id: K): RateLimit;
		public create(id: K): RateLimit;
	}

	export class Stopwatch {
		public constructor(digits?: number);
		public digits: number;
		private _start: number;
		private _end: number | null;

		public readonly duration: number;
		public readonly running: boolean;
		public restart(): this;
		public reset(): this;
		public start(): this;
		public stop(): this;
		public toString(): string;
	}

	export class Timestamp {
		public constructor(pattern: string);
		public pattern: string;
		private _template: TimestampObject[];

		public display(time?: Date | number | string): string;
		public displayUTC(time?: Date | number | string): string;
		public edit(pattern: string): this;

		public static timezoneOffset: number;
		public static utc(time?: Date | number | string): Date;
		public static displayArbitrary(pattern: string, time?: Date | number | string): string;
		private static _resolveDate(time: Date | number | string): Date;
		private static _display(template: string, time: Date | number | string): string;
		private static _patch(pattern: string): TimestampObject[];
	}

	class Util {
		public static arrayFromObject<T = any>(obj: Record<string, any>, prefix?: string): Array<T>;
		public static arraysStrictEquals(arr1: any[], arr2: any[]): boolean;
		public static chunk<T>(entries: T[], chunkSize: number): Array<T[]>;
		public static clean(text: string): string;
		public static codeBlock(lang: string, expression: string | number | Stringifible): string;
		public static deepClone<T = any>(source: T): T;
		public static exec(exec: string, options?: ExecOptions): Promise<{ stdout: string, stderr: string }>;
		public static getTypeName(input: any): string;
		public static isClass(input: any): input is Constructor<any>;
		public static isFunction(input: any): input is Function;
		public static isNumber(input: any): input is number;
		public static isObject(input: any): boolean;
		public static isPrimitive(input: any): input is string | number | boolean;
		public static isThenable(input: any): boolean;
		public static makeObject<T = Record<string, any>, S = Record<string, any>>(path: string, value: any, obj?: Record<string, any>): T & S;
		public static mergeDefault<T = Record<string, any>, S = Record<string, any>>(objDefaults: T, objSource: S): T & S;
		public static mergeObjects<T = Record<string, any>, S = Record<string, any>>(objTarget: T, objSource: S): T & S;
		public static objectToTuples(obj: Record<string, any>): Array<[string, any]>;
		public static regExpEsc(str: string): string;
		public static sleep<T = any>(delay: number, args?: T): Promise<T>;
		public static toTitleCase(str: string): string;
		public static tryParse<T = Record<string, any>>(value: string): T | string;
		private static initClean(client: KlasaClient): void;

		public static titleCaseVariants: TitleCaseVariants;
		public static PRIMITIVE_TYPES: string[];
	}

	export { Util as util };

//#endregion Util

//#endregion Classes

//#region Typedefs

	export interface KlasaClientOptions extends ClientOptions {
		console?: ConsoleOptions;
		consoleEvents?: ConsoleEvents;
		customPromptDefaults?: CustomPromptDefaults;
		disabledCorePieces?: string[];
		language?: string;
		noPrefixDM?: boolean;
		owners?: string[];
		pieceDefaults?: PieceDefaults;
		prefix?: string;
		production?: boolean;
		readyMessage?: ReadyMessage;
		regexPrefix?: RegExp;
		slowmode?: number;
		slowmodeAggressive?: boolean;
		settings?: SettingsOptions;
		typing?: boolean;
	}

	export interface SettingsOptions {
		preserve?: boolean;
		throwOnError?: boolean;
		gateways?: GatewaysOptions;
	}

	export interface CustomPromptDefaults {
		limit?: number;
		time?: number;
		quotedStringSupport?: boolean;
	}

	export interface PieceDefaults {
		events?: EventOptions;
		languages?: LanguageOptions;
		monitors?: MonitorOptions;
		tasks?: TaskOptions;
	}

	export type ReadyMessage = string | ((client: KlasaClient) => string);

	export interface GatewaysOptions extends Partial<Record<string, GatewayStorageOptions>> {
		clientStorage?: GatewayStorageOptions;
		guilds?: GatewayStorageOptions;
		users?: GatewayStorageOptions;
	}

	// Parsers
	export interface ArgResolverCustomMethod {
		(arg: string, possible: Possible, message: KlasaMessage, params: any[]): any;
	}

	export interface Constants {
		DEFAULTS: ConstantsDefaults;
		TIME: ConstantsTime;
		MENTION_REGEX: MentionRegex;
	}

	export interface ConstantsDefaults {
		CLIENT: Required<KlasaClientOptions>;
		CONSOLE: Required<ConsoleOptions>;
	}

	export interface ConstantsTime {
		SECOND: number;
		MINUTE: number;
		HOUR: number;
		DAY: number;
		DAYS: string[];
		MONTHS: string[];
		TIMESTAMP: {
			TOKENS: Map<string, number>;
		};
	}

	export type TimeResolvable = Date | number | string;

	// Structures
	export interface PieceOptions {
		enabled?: boolean;
		name?: string;
	}

	export interface AliasPieceOptions extends PieceOptions {
		aliases?: string[];
	}

	export interface MonitorOptions extends PieceOptions {
		allowedTypes?: MessageType[];
		ignoreBots?: boolean;
		ignoreEdits?: boolean;
		ignoreOthers?: boolean;
		ignoreSelf?: boolean;
		ignoreWebhooks?: boolean;
		ignoreBlacklistedGuilds?: boolean;
	}

	export interface EventOptions extends PieceOptions {
		emitter?: NodeJS.EventEmitter | FilterKeyInstances<KlasaClient, NodeJS.EventEmitter>;
		event?: string;
		once?: boolean;
	}

	export interface SerializerOptions extends AliasPieceOptions { }
	export interface LanguageOptions extends PieceOptions { }
	export interface TaskOptions extends PieceOptions { }

	export interface PieceJSON {
		directory: string;
		path: string;
		enabled: boolean;
		file: string[];
		name: string;
		type: string;
	}

	export interface AliasPieceJSON extends PieceJSON {
		aliases: string[];
	}

	export interface OriginalPropertyDescriptors {
		staticPropertyDescriptors: PropertyDescriptorMap;
		instancePropertyDescriptors: PropertyDescriptorMap;
	}

	export interface PieceCommandJSON extends AliasPieceJSON, Filter<Required<CommandOptions>,  'usage'> {
		category: string;
		subCategory: string;
	}

	export interface PieceEventJSON extends PieceJSON, Filter<Required<EventOptions>, 'emitter'> {
		emitter: string;
	}

	export interface PieceMonitorJSON extends PieceJSON, Required<MonitorOptions> { }
	export interface PieceSerializerJSON extends AliasPieceJSON, Required<SerializerOptions> { }
	export interface PieceLanguageJSON extends PieceJSON, Required<LanguageOptions> { }
	export interface PieceTaskJSON extends PieceJSON, Required<TaskOptions> { }

	// Util
	export enum ColorsClose {
		normal = 0,
		bold = 22,
		dim = 22,
		italic = 23,
		underline = 24,
		inverse = 27,
		hidden = 28,
		strikethrough = 29,
		text = 39,
		background = 49
	}

	export enum ColorsStyleTypes {
		normal = 0,
		bold = 1,
		dim = 2,
		italic = 3,
		underline = 4,
		inverse = 7,
		hidden = 8,
		strikethrough = 9
	}

	export enum ColorsTexts {
		black = 30,
		red = 31,
		green = 32,
		yellow = 33,
		blue = 34,
		magenta = 35,
		cyan = 36,
		lightgray = 37,
		lightgrey = 37,
		gray = 90,
		grey = 90,
		lightred = 91,
		lightgreen = 92,
		lightyellow = 93,
		lightblue = 94,
		lightmagenta = 95,
		lightcyan = 96,
		white = 97
	}

	export enum ColorsBackgrounds {
		black = 40,
		red = 41,
		green = 42,
		yellow = 43,
		blue = 44,
		magenta = 45,
		cyan = 46,
		gray = 47,
		grey = 47,
		lightgray = 100,
		lightgrey = 100,
		lightred = 101,
		lightgreen = 102,
		lightyellow = 103,
		lightblue = 104,
		lightmagenta = 105,
		lightcyan = 106,
		white = 107
	}

	export interface ColorsFormatOptions {
		background?: string;
		style?: string | string[];
		text?: string;
	}

	export type ColorsFormatType = string | number | [string, string, string] | [number, number, number];

	export interface ColorsFormatData {
		opening: string[];
		closing: string[];
	}

	export interface ConsoleOptions {
		utc?: boolean;
		colors?: ConsoleColorStyles;
		stderr?: NodeJS.WritableStream;
		stdout?: NodeJS.WritableStream;
		timestamps?: boolean | string;
		useColor?: boolean;
	}

	export interface ConsoleEvents {
		debug?: boolean;
		error?: boolean;
		log?: boolean;
		verbose?: boolean;
		warn?: boolean;
		wtf?: boolean;
	}

	export interface ConsoleColorStyles {
		debug?: ConsoleColorObjects;
		error?: ConsoleColorObjects;
		info?: ConsoleColorObjects;
		log?: ConsoleColorObjects;
		verbose?: ConsoleColorObjects;
		warn?: ConsoleColorObjects;
		wtf?: ConsoleColorObjects;
	}

	export interface ConsoleColorObjects {
		message?: ConsoleMessageObject;
		time?: ConsoleTimeObject;
	}

	export interface ConsoleMessageObject {
		background?: keyof typeof ColorsBackgrounds | null;
		style?: keyof typeof ColorsStyleTypes | null;
		text?: keyof typeof ColorsBackgrounds | null;
	}

	export interface ConsoleTimeObject {
		background?: keyof typeof ColorsBackgrounds | null;
		style?: keyof typeof ColorsStyleTypes | null;
		text?: keyof typeof ColorsBackgrounds | null;
	}

	export interface TimestampObject {
		content: string | null;
		type: string;
	}

	export interface MenuOptions {
		name: string;
		body: string;
		inline?: boolean;
	}

	export interface MentionRegex {
		userOrMember: RegExp;
		channel: RegExp;
		emoji: RegExp;
		role: RegExp;
		snowflake: RegExp;
	}

	interface Stringifible {
		toString(): string;
	}

	interface Constructor<C> {
		new(...args: any[]): C;
	}

	type PrimitiveType = string | number | boolean;

	// Based on the built-in `Pick<>` generic
	type Filter<T, K extends keyof T> = {
		[P in keyof T]: P extends K ? unknown : T[P];
	};

	type ValueOf<T> = T[keyof T];
	type FilterKeyInstances<O, T> = ValueOf<{
		[K in keyof O]: O[K] extends T ? K : never
	}>;

	export interface TitleCaseVariants extends Record<string, string> {
		textchannel: 'TextChannel';
		voicechannel: 'VoiceChannel';
		categorychannel: 'CategoryChannel';
		guildmember: 'GuildMember';
	}

//#endregion

//#region Augments
import { Guild } from 'discord.js';

	module 'discord.js' {

		export interface Client {
			constructor: typeof KlasaClient;
			readonly owners: Set<User>;
			options: Required<KlasaClientOptions>;
			userBaseDirectory: string;
			console: KlasaConsole;
			languages: LanguageStore;
			tasks: TaskStore;
			events: EventStore;
			pieceStores: Collection<string, any>;
			gateways: GatewayDriver;
			ready: boolean;
			mentionPrefix: RegExp | null;
			registerStore<K, V extends Piece, VConstructor = Constructor<V>>(store: Store<K, V, VConstructor>): KlasaClient;
			unregisterStore<K, V extends Piece, VConstructor = Constructor<V>>(store: Store<K, V, VConstructor>): KlasaClient;
			on(event: 'klasaReady', listener: () => void): this;
			on(event: 'log', listener: (data: any) => void): this;
			on(event: 'monitorError', listener: (message: KlasaMessage, monitor: Monitor, error: Error | string) => void): this;
			on(event: 'pieceDisabled', listener: (piece: Piece) => void): this;
			on(event: 'pieceEnabled', listener: (piece: Piece) => void): this;
			on(event: 'pieceLoaded', listener: (piece: Piece) => void): this;
			on(event: 'pieceReloaded', listener: (piece: Piece) => void): this;
			on(event: 'pieceUnloaded', listener: (piece: Piece) => void): this;
			on(event: 'settingsSync', listener: (entry: Settings) => void): this;
			on(event: 'settingsCreate', listener: (entry: Settings, changes: SettingsUpdateResults, context: SettingsUpdateContext) => void): this;
			on(event: 'settingsDelete', listener: (entry: Settings) => void): this;
			on(event: 'settingsUpdate', listener: (entry: Settings, changes: SettingsUpdateResults, context: SettingsUpdateContext) => void): this;
			on(event: 'verbose', listener: (data: any) => void): this;
			on(event: 'wtf', listener: (failure: Error) => void): this;
			once(event: 'klasaReady', listener: () => void): this;
			once(event: 'log', listener: (data: any) => void): this;
			once(event: 'monitorError', listener: (message: KlasaMessage, monitor: Monitor, error: Error | string) => void): this;
			once(event: 'pieceDisabled', listener: (piece: Piece) => void): this;
			once(event: 'pieceEnabled', listener: (piece: Piece) => void): this;
			once(event: 'pieceLoaded', listener: (piece: Piece) => void): this;
			once(event: 'pieceReloaded', listener: (piece: Piece) => void): this;
			once(event: 'pieceUnloaded', listener: (piece: Piece) => void): this;
			once(event: 'settingsSync', listener: (entry: Settings) => void): this;
			once(event: 'settingsCreate', listener: (entry: Settings, changes: SettingsUpdateResults, context: SettingsUpdateContext) => void): this;
			once(event: 'settingsDelete', listener: (entry: Settings) => void): this;
			once(event: 'settingsUpdate', listener: (entry: Settings, changes: SettingsUpdateResults, context: SettingsUpdateContext) => void): this;
			once(event: 'verbose', listener: (data: any) => void): this;
			once(event: 'wtf', listener: (failure: Error) => void): this;
			off(event: 'klasaReady', listener: () => void): this;
			off(event: 'log', listener: (data: any) => void): this;
			off(event: 'monitorError', listener: (message: KlasaMessage, monitor: Monitor, error: Error | string) => void): this;
			off(event: 'pieceDisabled', listener: (piece: Piece) => void): this;
			off(event: 'pieceEnabled', listener: (piece: Piece) => void): this;
			off(event: 'pieceLoaded', listener: (piece: Piece) => void): this;
			off(event: 'pieceReloaded', listener: (piece: Piece) => void): this;
			off(event: 'pieceUnloaded', listener: (piece: Piece) => void): this;
			off(event: 'settingsSync', listener: (entry: Settings) => void): this;
			off(event: 'settingsCreate', listener: (entry: Settings, changes: SettingsUpdateResults, context: SettingsUpdateContext) => void): this;
			off(event: 'settingsDelete', listener: (entry: Settings) => void): this;
			off(event: 'settingsUpdate', listener: (entry: Settings, changes: SettingsUpdateResults, context: SettingsUpdateContext) => void): this;
			off(event: 'verbose', listener: (data: any) => void): this;
			off(event: 'wtf', listener: (failure: Error) => void): this;
		}

		export interface Message {
			language: Language;
			prefix: RegExp | null;
			prefixLength: number | null;
			readonly responses: KlasaMessage[];
			readonly args: string[];
			readonly params: any[];
			readonly flagArgs: Record<string, string>;
			readonly reprompted: boolean;
		}

		export interface User {
			settings: Settings;
		}

		interface Constructor<C> {
			new(...args: any[]): C;
		}

	}

//#endregion

}
