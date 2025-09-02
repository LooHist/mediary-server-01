import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'

export default [
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: new URL('.', import.meta.url),
				sourceType: 'module'
			},
			globals: {
				require: 'readonly',
				module: 'readonly',
				__dirname: 'readonly',
				jest: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier: pluginPrettier
		},
		rules: {
			...tseslint.configs.recommended.rules,

			...prettier.rules,
			'prettier/prettier': 'error',

			'@typescript-eslint/interface-name-prefix': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			endOfLine: 'lf'
		}
	},
	{
		ignores: ['.eslintrc.js']
	}
]
