const { Argument } = require('klasa');

module.exports = class extends Argument {

	run(arg, possible, message) {
		const roleId = this.constructor.regex.role.test(arg) ? this.constructor.regex.role.exec(arg)[1] : null;
		const role = roleId ? message.guild.roles.fetch(roleId) : null;
		if (role) return role;
		throw message.language.get('RESOLVER_INVALID_ROLE', possible.name);
	}

};
