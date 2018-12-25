module.exports = {
	init: () => ({
		mkrole: async ({ msg, rawArgs }) => {
			if (!msg.member.hasPermission("MANAGE_ROLES")) return "no";
			await msg.guild.createRole({ name: rawArgs });
			return "Created!";
		},
		rmrole: async ({ msg, rawArgs }) => {
			if (!msg.member.hasPermission("MANAGE_ROLES")) return "no";
			const role = msg.guild.roles.find(
				x => x.name.toLowerCase() === rawArgs.toLowerCase()
			);
			if (!role) return "Couldn't find that role :/";
			await role.delete();
			return "Deleted!";
		}
	}),
	canExecute: ({ msg }) => msg.member.hasPermission("MANAGE_ROLES")
};
