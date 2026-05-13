import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
	{
		ignores: [
			"**/node_modules/**",
			"main.js",
			"**/*.mjs",
			"scripts/deploy.js",
			"package.json",
		],
	},
	...obsidianmd.configs.recommended,
	...tseslint.configs.recommendedTypeChecked.map((config) => ({
		...config,
		files: ["**/*.ts"],
	})),
	{
		files: ["**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["**/*.ts"],
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"no-console": ["error", { allow: ["warn", "error", "debug"] }],
		},
	},
];
