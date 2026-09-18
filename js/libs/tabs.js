export class Tabs {
	static wire() {
		const tabs = document.querySelectorAll('.tab-btn');
		const contents = document.querySelectorAll('.tab-content');

		const pathname = window.location.pathname;
		const keyname = 'tabs_' + pathname.split('/').pop().replace(/.[^/.]+$/, "");
		const activeTabTarget = localStorage.getItem(keyname);

		// Switch default tab when clicking on tab
		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				const targetId = tab.dataset.target;

				tabs.forEach(t => t.classList.remove('active'));
				contents.forEach(c => c.classList.remove('active'));

				tab.classList.add('active');
				document.getElementById(targetId).classList.add('active');

				// Sauvegarde de l'ID cible de l'onglet actif
				localStorage.setItem(keyname, targetId);
			});
		});


		if (activeTabTarget) {
			// Search active tab
			const activeTabButton = document.querySelector(`.tab-btn[data-target="${activeTabTarget}"]`);
			const activeContent = document.getElementById(activeTabTarget);

			// Display the active tab
			if (activeTabButton && activeContent) {
				tabs.forEach(t => t.classList.remove('active'));
				contents.forEach(c => c.classList.remove('active'));

				activeTabButton.classList.add('active');
				activeContent.classList.add('active');
			}
		}
	}
}


