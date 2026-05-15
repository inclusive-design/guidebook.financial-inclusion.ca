import { parseHTML } from 'linkedom';

const getContent = (element) => {
	const elements = [];
	while (element.nextElementSibling && element.nextElementSibling.tagName !== 'H3' && element.nextElementSibling.tagName !== 'H4' && element.nextElementSibling.tagName !== 'H5') {
		elements.push(element.nextElementSibling);
		element = element.nextElementSibling;
	}

	for (const node of elements) {
		node.remove();
	}

	return elements;
};

const parseTransform = (value, outputPath) => {
	if (outputPath && outputPath.includes('.html')) {
		const { document } = parseHTML(value);

		const pageNavHeadings = document.querySelectorAll('main.export h2:not([data-narrative]):not([data-toc])');
		if (pageNavHeadings.length > 0) {
			const navContainer = document.querySelector('main nav #toc ol');
			for (const heading of pageNavHeadings) {
				if (heading.parentNode.tagName !== 'NAV') {
					const link = document.createElement('a');
					link.setAttribute('href', `#${heading.id}`);
					link.innerHTML = heading.textContent;
					const li = document.createElement('li');
					li.append(link);
					navContainer.append(li);
				}
			}
		}

		const sliceSectionHeadings = document.querySelectorAll('main.export #breakdown-of-the-different-factors ~ h5, .main.export #decomposition-des-differents-facteurs');
		if (sliceSectionHeadings.length > 0) {
			for (const heading of sliceSectionHeadings) {
				const contents = getContent(heading);
				const section = document.createElement('section');
				section.className = 'flow';
				section.setAttribute('aria-labelledby', heading.id);
				heading.parentNode.insertBefore(section, heading.nextElementSibling);
				section.append(heading);
				for (const node of contents) {
					section.append(node);
				}
			}
		}

		if (outputPath.includes('chapters') || outputPath.includes('chapitres')) {
			const headings = document.querySelectorAll('main h3, main h4, main h5, main h6');
			for (const heading of headings) {
				if (heading.tagName === 'H3') {
					heading.setAttribute('aria-level', 2);
				}

				if (heading.tagName === 'H4') {
					heading.setAttribute('aria-level', 3);
				}

				if (heading.tagName === 'H5') {
					heading.setAttribute('aria-level', 4);
				}

				if (heading.tagName === 'H6') {
					heading.setAttribute('aria-level', 5);
				}
			}
		} else if (outputPath === './_site/index.html' || outputPath === './_site/fr/index.html') {
			const headings = document.querySelectorAll('main h3');
			for (const heading of headings) {
				heading.setAttribute('aria-level', 2);
			}
		}

		return '<!DOCTYPE html>\r\n' + document.documentElement.outerHTML;
	}

	return value;
};

export default parseTransform;
