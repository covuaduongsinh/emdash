import { definePlugin } from "emdash";

export function myLocalPlugin() {
	return {
		id: "my-local-plugin",
		version: "1.0.0",
		entrypoint: "./src/plugins/my-local-plugin/index.ts",
	};
}

export function createPlugin() {
	return definePlugin({
		id: "my-local-plugin",
		version: "1.0.0",
		hooks: {
			"plugin:activate": {
				handler: async () => {
					console.log("🚀 My Local Plugin Activated!");
				},
			},
		},
	});
}

export default createPlugin;
