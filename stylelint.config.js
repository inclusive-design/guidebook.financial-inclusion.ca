export default {
	extends: '@inclusive-design/stylelint-config',
	ignoreFiles: ['_site/**'],
	rules: {
		'at-rule-prelude-no-invalid': [true, { ignoreAtRules: ['page'] }],
		'at-rule-descriptor-no-unknown': undefined,
		'custom-property-pattern': undefined,
		'declaration-property-value-no-unknown': undefined,
		'function-no-unknown': [true, {
			ignoreFunctions: ['string', 'content'],
		}],
		'no-descending-specificity': undefined,
		'property-no-deprecated': [true, { ignoreProperties: ['clip', 'page-break-after', 'page-break-before'] }],
		'property-no-unknown': [true, { ignoreProperties: ['page-group', 'string-set'] }],
		'selector-class-pattern': undefined,
		'selector-pseudo-class-no-unknown': [
			true,
			{ ignorePseudoClasses: ['first-of-group'] },
		],
	},
};
