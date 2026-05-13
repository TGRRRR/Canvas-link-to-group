import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
	{
		ignores: ["**/node_modules/**", "main.js", "**/*.mjs", "scripts/deploy.js"],
	},
	...tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["**/*.ts"],
		plugins: {
			obsidianmd,
		},
		rules: {
			...obsidianmd.configs.recommended.rules,
			"@typescript-eslint/no-unused-vars": ["error", {
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
			}],
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
);
