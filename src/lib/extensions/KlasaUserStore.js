const { UserManager } = require('discord.js');

/**
 * Contains extensions to the base UserStore class
 * @extends external:UserManager
 */
class KlasaUserStore extends UserManager {

	/**
	 * Fetches a user and syncs their settings
	 * @param  {...any} args d.js UserStore#fetch arguments
	 */
	async fetch(...args) {
		const user = await super.fetch(...args);
		await user.settings.sync();
		return user;
	}

}

module.exports = KlasaUserStore;
