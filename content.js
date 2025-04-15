// Search for the div that affects mail rows
function searchMailRowsContainer() {
	return new Promise((resolve) => {
		const interval = setInterval(() => {
			const navigationDiv = document.querySelector('div[role="navigation"]');
			if (navigationDiv) {
				const parent = navigationDiv.parentElement;
				if (parent) {
					// Find all sibling divs
					const siblingDivs = Array.from(parent.children).filter((el) => el.tagName === 'DIV');
					// Get the third div after navigationDiv
					const targetDiv = siblingDivs[siblingDivs.indexOf(navigationDiv) + 3];
					if (targetDiv) {
						clearInterval(interval);
						resolve(targetDiv);
					}
				}
			}
		}, 1000);
	});
}

// Search for mail container element
function searchMailElement() {
	return new Promise((resolve) => {
		const interval = setInterval(() => {
			const p1 = document.querySelector('table[role="grid"] > tbody');
			const p2 = document.querySelector('table[aria-readonly="true"] > tbody');
			if (p1) {
				clearInterval(interval);
				resolve(p1);
			}
			if (p2) {
				clearInterval(interval);
				resolve(p2);
			}
		}, 1000);
	});
}

// Create visual label for an email
function createVisualLabel(labelName) {
	const div = document.createElement('div');
	div.style.height = '16px';
	div.style.backgroundColor = '#4285f4';
	div.style.borderRadius = '4px';
	div.style.display = 'flex';
	div.style.alignItems = 'center';
	div.style.justifyContent = 'center';
	div.style.margin = '0px 4px 0 0';
	div.style.padding = '2px 4px';
	div.style.whiteSpace = 'nowrap';

	const p = document.createElement('p');
	p.innerText = labelName;
	p.style.fontSize = '12px';
	p.style.color = 'white';

	div.appendChild(p);
	return div;
}

// Process a single email element
async function processEmailElement(element) {
	// Get email content from the element
	const content = element.textContent || '';

	// Get rules from storage
	const data = await chrome.storage.sync.get('labelRules');
	const rules = data.labelRules || [];

	// Check each rule
	for (const rule of rules) {
		let matches = false;

		// Extract email parts for matching
		const emailText = content.toLowerCase();
		const ruleSender = rule.sender?.toLowerCase();
		const ruleEmail = rule.email?.toLowerCase();
		const ruleSubject = rule.subject?.toLowerCase();
		const ruleContent = rule.content?.toLowerCase();

		// Match against rule conditions
		if (ruleSender && emailText.includes(ruleSender)) matches = true;
		if (!matches && ruleEmail && emailText.includes(ruleEmail)) matches = true;
		if (!matches && ruleSubject && emailText.includes(ruleSubject)) matches = true;
		if (!matches && ruleContent && emailText.includes(ruleContent)) matches = true;

		if (matches) {
			// Check if this label already exists
			const existingLabels = element.querySelectorAll('.gmail-label-extension');
			const labelExists = Array.from(existingLabels).some(
				(label) => label.textContent === rule.label
			);

			// Only add if label doesn't exist yet
			if (!labelExists) {
				const visualLabel = createVisualLabel(rule.label);
				visualLabel.classList.add('gmail-label-extension'); // Add identifier class
				element.appendChild(visualLabel);
			}
		}
	}
}

// Main function to process emails
async function processEmails() {
	try {
		// Find mail container
		const mailElement = await searchMailElement();
		if (!mailElement) return;

		// Process each email row
		const emailRows = mailElement.childNodes;
		for (const element of emailRows) {
			if (element.nodeType === Node.ELEMENT_NODE) {
				await processEmailElement(element);
			}
		}
	} catch (error) {
		console.error('Error processing emails:', error);
	}
}

// Initialize the extension
async function initializeExtension() {
	try {
		// Initial processing
		await processEmails();

		// Set up history state observer
		const pushState = history.pushState;
		history.pushState = function () {
			pushState.apply(history, arguments);
			setTimeout(processEmails, 1000);
		};

		// Create MutationObserver to watch for new emails
		const observer = new MutationObserver((mutations) => {
			processEmails().catch((error) => {
				console.error('Error in mutation observer:', error);
			});
		});

		// Start observing once mail element is found
		const mailElement = await searchMailElement();
		if (mailElement) {
			observer.observe(mailElement, { childList: true, subtree: true });
		}
	} catch (error) {
		console.error('Error initializing extension:', error);
	}
}

// Start the extension with a delay to ensure Gmail is loaded
setTimeout(initializeExtension, 2000);

// Watch for changes in the mail rows container
async function watchMailRowsContainer() {
	const container = await searchMailRowsContainer();
	if (container) {
		const observer = new MutationObserver((mutations) => {
			processEmails().catch((error) => {
				console.error('Error in mail rows container observer:', error);
			});
		});
		observer.observe(container, { childList: true, subtree: true });
	}
}

// Start watching the mail rows container
setTimeout(watchMailRowsContainer, 2000);
