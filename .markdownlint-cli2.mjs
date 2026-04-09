import markdownlintConfig from '@inclusive-design/markdownlint-config';

export default {
	config: markdownlintConfig.config,
	ignores: ['node_modules', 'src/collections/**', 'CHANGELOG.md'],
};
