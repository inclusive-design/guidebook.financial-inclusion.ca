import {existsSync} from 'node:fs';
import {env} from 'node:process';
import * as childProcess from 'node:child_process';
import {IdAttributePlugin, RenderPlugin} from '@11ty/eleventy';
import eleventyNavigationPlugin from '@11ty/eleventy-navigation';
import fontAwesomePlugin from '@11ty/font-awesome';
import fluidPlugin, {__} from 'eleventy-plugin-fluid';
import footnotesPlugin from 'eleventy-plugin-footnotes';
import _ from 'lodash';
import {consolePlus} from 'eleventy-plugin-console-plus';
import Image from '@11ty/eleventy-img';
import {parseHTML} from 'linkedom';
import markdownItAttrs from 'markdown-it-attrs';
import parseTransform from './src/_transforms/parse-transform.js';
import findTranslation from './src/_filters/find-translation.js';

const eleventyImage = Image;

/**
 * @param {object} eleventyConfig The Eleventy configuration object.
 * @returns {object} Eleventy configuration.
 */
export default function eleventy(eleventyConfig) {
	eleventyConfig.addGlobalData('now', () => new Date());
	eleventyConfig.addPlugin(fontAwesomePlugin);
	eleventyConfig.addPlugin(eleventyNavigationPlugin);
	eleventyConfig.addPlugin(RenderPlugin);
	eleventyConfig.addPlugin(footnotesPlugin);
	eleventyConfig.addPlugin(consolePlus);
	eleventyConfig.addPlugin(fluidPlugin, {
		defaultLanguage: 'en',
		supportedLanguages: {
			en: {
				slug: 'en',
				name: 'English',
			},
			fr: {
				slug: 'fr',
				name: 'Français',
				dir: 'ltr',
				uioSlug: 'fr',
			},
		},
		css: {enabled: false},
		minify: {enabled: false},
		markdown: {
			plugins: [
				[markdownItAttrs, {}],
			],
		},
	});

	for (const lang of ['en', 'fr']) {
		eleventyConfig.addCollection(`front-matter-${lang}`, collection => collection.getFilteredByGlob(`src/collections/front-matter/${lang}/*.md`).toSorted((a, b) => a.data.order - b.data.order));

		eleventyConfig.addCollection(`chapters-${lang}`, collection => collection.getFilteredByGlob(`src/collections/chapters/${lang}/*.md`).toSorted((a, b) => a.data.order - b.data.order));

		eleventyConfig.addCollection(`back-matter-${lang}`, collection => collection.getFilteredByGlob(`src/collections/back-matter/${lang}/*.md`).toSorted((a, b) => a.data.order - b.data.order));

		eleventyConfig.addCollection(`paginated-${lang}`, collection => collection.getFilteredByGlob([
			`src/collections/chapters/${lang}/*.md`,
			`src/collections/back-matter/${lang}/*.md`,
		])
			.toSorted((a, b) => a.data.order - b.data.order));

		eleventyConfig.addCollection(`all-${lang}`, collection => collection.getFilteredByGlob(`src/collections/*/${lang}/*.md`).toSorted((a, b) => a.data.order - b.data.order));
	}

	eleventyConfig.addFilter('findTranslation', findTranslation);

	/*
      Provide a custom duplicate of eleventy-plugin-fluid's uioInit shortcode in
      order to run it without the text-size preference.
  */
	eleventyConfig.addShortcode('uioCustomInit', (locale, direction) => {
		const options = {
			preferences: ['fluid.prefs.lineSpace', 'fluid.prefs.textFont', 'fluid.prefs.contrast', 'fluid.prefs.enhanceInputs'],
			auxiliarySchema: {
				terms: {
					templatePrefix: '/lib/infusion/src/framework/preferences/html',
					messagePrefix: '/lib/infusion/src/framework/preferences/messages',
				},
				'fluid.prefs.contrast': {
					alias: 'theme',
					enactor: {
						classes: {
							dark: 'fl-theme-dark',
							light: 'fl-theme-light',
						},
					},
					panel: {
						classnameMap: {
							theme: {
								dark: 'fl-theme-dark',
								light: 'fl-theme-light',
							},
						},
						markup: {
							label: `
                <span class="fl-hidden-accessible">%theme</span>
                <svg class="fl-preview-A" aria-hidden="true" width="16" height="18" viewBox="0 0 8 9">
                    <use href="#preview-a" />
                </svg>
                <svg class="fl-preview-light" aria-hidden="true" fill="none" viewBox="0 0 256 256" stroke="currentColor" width="24" height="24">
                    <use href="#preview-light" />
                </svg>
                <svg class="fl-preview-dark" aria-hidden="true" fill="none" viewBox="0 0 256 256" width="24" height="24">
                    <use href="#preview-dark" />
                </svg>
                <div class="fl-crossout" aria-hidden="true"></div>`,
						},
						message: '/assets/messages/contrast.json',
					},
				},
			},
			primarySchema: {
				'fluid.prefs.contrast': {
					type: 'string',
					default: 'default',
					enum: ['default', 'dark', 'light', 'bw', 'wb', 'by', 'yb', 'lgdg', 'gw', 'gd', 'bbr'],
					enumLabels: [
						'contrast-default',
						'contrast-dark',
						'contrast-light',
						'contrast-bw',
						'contrast-wb',
						'contrast-by',
						'contrast-yb',
						'contrast-lgdg',
						'contrast-gw',
						'contrast-gd',
						'contrast-bbr',
					],
				},
			},
			prefsEditorLoader: {
				lazyLoad: true,
			},
			locale,
			direction,
		};

		return `<script>fluid.uiOptions.multilingual(".flc-prefsEditor-separatedPanel", ${JSON.stringify(options)});</script>`;
	});

	eleventyConfig.addNunjucksAsyncShortcode('includeSvg', async (fileSlug, altText = '', className, displayPrint = true) => {
		if (fileSlug.includes('.svg')) {
			fileSlug = fileSlug.split('.svg')[0];
		}

		let printSlug = fileSlug;

		if (existsSync(`./src/assets/images/${fileSlug}-print.svg`)) {
			printSlug = `${fileSlug}-print`;
		}

		const printImg = `<img src="/assets/images/${printSlug}.svg" alt="${altText}" class="${className ? `print ${className}` : 'print'}" />`;

		const primaryImage = await eleventyImage(`./src/assets/images/${fileSlug}.svg`, {
			formats: ['svg'],
			dryRun: true,
		});

		const {document} = parseHTML(primaryImage.svg[0].buffer.toString());
		const svg = document.querySelector('svg');
		if (altText === '') {
			svg.setAttribute('role', 'presentation');
		} else {
			svg.setAttribute('role', 'img');
			svg.setAttribute('aria-label', altText);
		}

		if (className) {
			svg.setAttribute('class', `web ${className}`);
		} else {
			svg.setAttribute('class', 'web');
		}

		let mobileSvg;

		if (existsSync(`./src/assets/images/${fileSlug}-mobile.svg`)) {
			const mobileImage = await eleventyImage(`./src/assets/images/${fileSlug}-mobile.svg`, {
				formats: ['svg'],
				dryRun: true,
			});

			const {mobileDocument} = parseHTML(mobileImage.svg[0].buffer.toString());
			mobileSvg = mobileDocument.querySelector('svg');
			if (altText === '') {
				mobileSvg.setAttribute('role', 'presentation');
			} else {
				mobileSvg.setAttribute('role', 'img');
				mobileSvg.setAttribute('aria-label', altText);
			}

			if (className) {
				mobileSvg.setAttribute('class', `web mobile ${className}`);
			} else {
				mobileSvg.setAttribute('class', 'web mobile');
			}

			if (className) {
				svg.setAttribute('class', `web desktop ${className}`);
			} else {
				svg.setAttribute('class', 'web desktop');
			}
		}

		return `${displayPrint ? printImg : ''}${svg.toString()}${mobileSvg ? mobileSvg.toString() : ''}`;
	});

	eleventyConfig.addTransform('parse', parseTransform);

	eleventyConfig.addPassthroughCopy({
		'src/admin/config.yml': 'admin/config.yml',
	});

	eleventyConfig.addPassthroughCopy({
		'src/robots.txt': 'robots.txt',
	});

	eleventyConfig.addPassthroughCopy({'src/assets/icons': '/'});
	eleventyConfig.addPassthroughCopy('src/assets/downloads');
	eleventyConfig.addPassthroughCopy('src/assets/messages');

	eleventyConfig.addPlugin(IdAttributePlugin, {
		selector: 'h2,h3,h4,h5',
	});

	eleventyConfig.addPreprocessor('drafts', '*', (data, _content) => {
		if (data.draft && env.ELEVENTY_RUN_MODE === 'build') {
			return false;
		}
	});

	eleventyConfig.addShortcode('lastCommitDate', function () {
		const lastUpdatedFromGit = childProcess.execSync('git log -1 --format=%cd --date=short').toString().trim();
		const formattedDate = new Date(lastUpdatedFromGit).toLocaleString(`${this.ctx.page.lang}-CA`, {month: 'long', year: 'numeric'});
		return formattedDate;
	});

	return {
		dir: {
			input: 'src',
		},
		templateFormats: ['njk', 'md', 'css', 'png', 'jpg', 'svg'],
		htmlTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
	};
}
