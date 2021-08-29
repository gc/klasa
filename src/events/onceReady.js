const { Event, util } = require('klasa');

module.exports = class extends Event {

	constructor(...args) {
		super(...args, {
			once: true,
			event: 'ready'
		});
	}

	async run() {
		this.client.mentionPrefix = new RegExp(`^<@!?${this.client.user.id}>`);

		const clientStorage = this.client.gateways.get('clientStorage');
		// Added for consistency with other datastores, Client#clients does not exist
		clientStorage.cache.set(this.client.user.id, this.client);
		this.client.settings = clientStorage.create(this.client, this.client.user.id);
		await Promise.all(this.client.gateways.map(gateway => gateway.sync()));

		// Init all the pieces
		await Promise.all(this.client.pieceStores.filter(store => !['providers', 'extendables'].includes(store.name)).map(store => store.init()));
		util.initClean(this.client);

		// Initialize guild cache:
		const guildsGateway = this.client.gateways.get('guilds');
		await Promise.all(
			this.client.guilds.cache.map(guild => {
				const settings = guildsGateway.acquire(guild);
				return settings.sync(true).then(() => { guildsGateway.cache.set(guild.id, { settings }); });
			})
		);

		this.client.ready = true;

		if (this.client.options.readyMessage !== null) {
			this.client.emit('log', util.isFunction(this.client.options.readyMessage) ? this.client.options.readyMessage(this.client) : this.client.options.readyMessage);
		}

		return this.client.emit('klasaReady');
	}

};
