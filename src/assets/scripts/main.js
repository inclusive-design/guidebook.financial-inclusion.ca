document.addEventListener('click', (event) => {
	if (!event.target.closest('.navigation [aria-expanded]')) {
		const allMenuButtons = document.querySelectorAll('.navigation [aria-expanded=\'true\']');
		for (const button of allMenuButtons) {
			button.setAttribute('aria-expanded', false);
		}

		return;
	}

	const menuButton = event.target.closest('.navigation [aria-expanded]');
	const expanded = menuButton.getAttribute('aria-expanded') === 'true' || false;
	if (!expanded) {
		const allMenuButtons = document.querySelectorAll('.navigation li [aria-expanded=\'true\']');
		for (const button of allMenuButtons) {
			button.setAttribute('aria-expanded', false);
		}
	}

	menuButton.setAttribute('aria-expanded', !expanded);
});

document.addEventListener('keyup', (event) => {
	if (event.key === 'Escape') {
		const allMenuButtons = document.querySelectorAll('.navigation [aria-expanded=\'true\']');
		for (const button of allMenuButtons) {
			button.setAttribute('aria-expanded', false);
		}
	}
});

const subMenus = document.querySelectorAll('.navigation li:has([aria-expanded])');
for (const subMenu of subMenus) {
	subMenu.addEventListener(
		'blur',
		(event) => {
			if (!subMenu.contains(event.relatedTarget)) {
				subMenu.querySelector('[aria-expanded]').setAttribute('aria-expanded', false);
			}
		},
		true,
	);
}
