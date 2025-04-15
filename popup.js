document.addEventListener('DOMContentLoaded', function () {
	const openRulesButton = document.getElementById('openRules');
	const applyRulesButton = document.getElementById('applyRules');
	const statusDiv = document.getElementById('status');

	openRulesButton.addEventListener('click', function () {
		chrome.tabs.create({
			url: chrome.runtime.getURL('rules.html'),
		});
	});

	applyRulesButton.addEventListener('click', async function () {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab.url.includes('mail.google.com')) {
			statusDiv.textContent = 'Please open Gmail to apply rules';
			return;
		}

		statusDiv.textContent = 'Applying rules...';

		try {
			await chrome.scripting.executeScript({
				target: { tabId: tab.id },
				function: applyLabelRules,
			});
			statusDiv.textContent = 'Rules applied successfully!';
		} catch (error) {
			statusDiv.textContent = 'Error applying rules: ' + error.message;
		}
	});
});

// This function will be injected into the Gmail page
function applyLabelRules() {
	chrome.storage.sync.get('labelRules', function (data) {
		const rules = data.labelRules || [];
		if (rules.length === 0) {
			console.warn('No label rules found');
			return;
		}

		// Using the provided email extraction function
		const container = document.querySelector('div[id=":1"]');
		if (!container) {
			console.warn('Gmail container not found');
			return;
		}

		const emailRows = container.querySelectorAll('tr[role="row"]');
		const emails = Array.from(emailRows).map((row) => {
			const senderEl = row.querySelector('span[translate="no"]');
			const subjectEl = row.querySelector('div[role="link"] > div > div > span');
			const snippetEl = row.querySelector('div[role="link"] > div > span');

			const senderName = senderEl ? senderEl.textContent.trim() : null;
			const senderEmail =
				senderEl?.getAttribute('email') || senderEl?.getAttribute('data-hovercard-id') || null;

			return {
				element: row,
				sender: senderName,
				email: senderEmail,
				subject: subjectEl ? subjectEl.textContent.trim() : null,
				snippet: snippetEl ? snippetEl.textContent.trim().replace(/^ – /, '') : null,
			};
		});

		// Apply rules to each email
		emails.forEach((email) => {
			rules.forEach((rule) => {
				let matches = false;

				if (rule.sender && email.sender) {
					matches = email.sender.toLowerCase().includes(rule.sender.toLowerCase());
				}
				if (!matches && rule.email && email.email) {
					matches = email.email.toLowerCase().includes(rule.email.toLowerCase());
				}
				if (!matches && rule.subject && email.subject) {
					matches = email.subject.toLowerCase().includes(rule.subject.toLowerCase());
				}
				if (!matches && rule.content && email.snippet) {
					matches = email.snippet.toLowerCase().includes(rule.content.toLowerCase());
				}

				if (matches) {
					// TODO: Implement Gmail label API integration
					console.log(`Match found! Apply label "${rule.label}" to:`, email);
				}
			});
		});
	});
}
