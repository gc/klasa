const { Event } = require('klasa');

module.exports = class extends Event {

	constructor(...args) {
		super(...args, { event: 'guildCreate' });
	}

	run(guild) {
		if (!guild.available) return;
		if (this.client.settings.get('guildBlacklist').includes(guild.id)) {
			guild.leave();
			this.client.emit('warn', `Blacklisted guild detected: ${guild.name} [${guild.id}]`);
		}
		/* Create cache entry for new guild: */
		const guildsGateway = this.client.gateways.get('guilds');
		const guildSettings = guildsGateway.acquire(guild);
		guildSettings.sync(true).then(() => guildsGateway.cache.set(guild.id, { settings: guildSettings }));
	}

};
