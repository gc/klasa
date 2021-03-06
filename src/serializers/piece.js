const { Serializer } = require('klasa');

module.exports = class extends Serializer {

	constructor(...args) {
		super(...args);

		// Adds all pieces, custom or not, to this serialize piece for use in schemas
		this.aliases = [...this.client.pieceStores.keys()].map(type => type.slice(0, -1));
	}

	async validate(data, { entry, language }) {
		if (entry.type === 'piece') {
			for (const store of this.client.pieceStores.values()) {
				const pce = store.get(data);
				if (pce) return pce;
			}
			throw language.get('RESOLVER_INVALID_PIECE', entry.key, entry.type);
		}
		const store = this.client.pieceStores.get(`${entry.type}s`);
		if (!store) throw language.get('RESOLVER_INVALID_STORE', entry.type);
		const parsed = typeof data === 'string' ? store.get(data) : data;
		if (parsed && parsed instanceof store.holds) return parsed;
		throw language.get('RESOLVER_INVALID_PIECE', entry.key, entry.type);
	}

	serialize(value) {
		return value.name;
	}

};
