// DOM Elements
const rulesContainer = document.getElementById('rulesContainer');
const addRuleForm = document.getElementById('addRuleForm');
const importExportDiv = document.getElementById('importExport');
const jsonDataArea = document.getElementById('jsonData');
let editingRuleIndex = -1;

// Buttons
document.getElementById('addRule').addEventListener('click', showAddRuleForm);
document.getElementById('importRules').addEventListener('click', showImportExport);
document.getElementById('exportRules').addEventListener('click', exportRules);
document.getElementById('saveRule').addEventListener('click', saveRule);
document.getElementById('cancelRule').addEventListener('click', hideAddRuleForm);
document.getElementById('saveImport').addEventListener('click', saveImportedRules);
document.getElementById('cancelImport').addEventListener('click', hideImportExport);

// Load existing rules on page load
document.addEventListener('DOMContentLoaded', () => {
	loadRules();
	setupColorTypeHandlers();
});

// Setup color type radio button handlers
function setupColorTypeHandlers() {
	const usePreset = document.getElementById('usePreset');
	const useCustom = document.getElementById('useCustom');
	const presetColors = document.querySelector('.color-options');
	const customColor = document.getElementById('customColor');

	function updateColorInputs() {
		if (usePreset.checked) {
			presetColors.style.opacity = '1';
			presetColors.style.pointerEvents = 'auto';
			customColor.style.opacity = '0.5';
			customColor.disabled = true;
		} else {
			presetColors.style.opacity = '0.5';
			presetColors.style.pointerEvents = 'none';
			customColor.style.opacity = '1';
			customColor.disabled = false;
		}
	}

	usePreset.addEventListener('change', updateColorInputs);
	useCustom.addEventListener('change', updateColorInputs);

	// Initialize state
	updateColorInputs();
}

function showAddRuleForm() {
	if (editingRuleIndex === -1) {
		clearForm(); // Only clear if we're not editing
	}
	addRuleForm.classList.remove('hidden');
	importExportDiv.classList.add('hidden');
}

function hideAddRuleForm() {
	addRuleForm.classList.add('hidden');
	clearForm();
	editingRuleIndex = -1;
}

function showImportExport() {
	importExportDiv.classList.remove('hidden');
	addRuleForm.classList.add('hidden');

	// Load current rules into textarea
	chrome.storage.sync.get('labelRules', function (data) {
		const rules = data.labelRules || [];
		jsonDataArea.value = JSON.stringify({ labelRules: rules }, null, 2);
	});
}

function hideImportExport() {
	importExportDiv.classList.add('hidden');
	jsonDataArea.value = '';
}

function clearForm() {
	document.getElementById('labelName').value = '';
	document.getElementById('sender').value = '';
	document.getElementById('email').value = '';
	document.getElementById('subject').value = '';
	document.getElementById('content').value = '';
	// Reset to default preset color
	document.getElementById('usePreset').checked = true;
	document.querySelector('input[name="labelColor"][value="#4285f4"]').checked = true;
	document.getElementById('customColor').value = '#4285f4';
}

function loadRules() {
	chrome.storage.sync.get('labelRules', function (data) {
		const rules = data.labelRules || [];
		displayRules(rules);
	});
}

function displayRules(rules) {
	rulesContainer.innerHTML = '';

	if (rules.length === 0) {
		rulesContainer.innerHTML = '<p>No rules found. Click "Add New Rule" to create one.</p>';
		return;
	}

	rules.forEach((rule, index) => {
		const ruleCard = document.createElement('div');
		ruleCard.className = 'rule-card';
		ruleCard.innerHTML = `
      <h3>
        <span class="color-dot" style="background-color: ${
					rule.color || '#4285f4'
				}; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 8px;"></span>
        Rule ${index + 1}: ${rule.label}
      </h3>
      ${rule.sender ? `<p><strong>Sender:</strong> ${rule.sender}</p>` : ''}
      ${rule.email ? `<p><strong>Email:</strong> ${rule.email}</p>` : ''}
      ${rule.subject ? `<p><strong>Subject contains:</strong> ${rule.subject}</p>` : ''}
      ${rule.content ? `<p><strong>Content contains:</strong> ${rule.content}</p>` : ''}
      <div class="rule-actions">
        <button class="edit-button" data-index="${index}">Edit</button>
        <button class="delete-button" data-index="${index}">Delete</button>
      </div>
    `;
		rulesContainer.appendChild(ruleCard);
	});

	// Add event delegation for rule actions
	rulesContainer.addEventListener('click', (e) => {
		const button = e.target.closest('button');
		if (!button) return;

		const index = parseInt(button.dataset.index);
		if (isNaN(index)) return;

		if (button.classList.contains('edit-button')) {
			editRule(index);
		} else if (button.classList.contains('delete-button')) {
			deleteRule(index);
		}
	});
}

function saveRule() {
	const rule = {
		label: document.getElementById('labelName').value.trim(),
		color: document.getElementById('useCustom').checked
			? document.getElementById('customColor').value
			: document.querySelector('input[name="labelColor"]:checked').value || '#4285f4',
		sender: document.getElementById('sender').value.trim(),
		email: document.getElementById('email').value.trim(),
		subject: document.getElementById('subject').value.trim(),
		content: document.getElementById('content').value.trim(),
	};

	if (!rule.label) {
		alert('Label name is required!');
		return;
	}

	if (!rule.sender && !rule.email && !rule.subject && !rule.content) {
		alert('At least one matching condition is required!');
		return;
	}

	chrome.storage.sync.get('labelRules', function (data) {
		const rules = data.labelRules || [];

		if (editingRuleIndex >= 0) {
			// Update existing rule
			rules[editingRuleIndex] = rule;
		} else {
			// Add new rule
			rules.push(rule);
		}

		chrome.storage.sync.set({ labelRules: rules }, function () {
			hideAddRuleForm();
			loadRules();
		});
	});
}

function editRule(index) {
	chrome.storage.sync.get('labelRules', function (data) {
		const rules = data.labelRules || [];
		const rule = rules[index];

		console.log('Editing rule:', rule);

		// Set form values before showing form
		document.getElementById('labelName').value = rule.label || '';
		document.getElementById('sender').value = rule.sender || '';
		document.getElementById('email').value = rule.email || '';
		document.getElementById('subject').value = rule.subject || '';
		document.getElementById('content').value = rule.content || '';

		// Set color
		const colorInput = document.querySelector(`input[name="labelColor"][value="${rule.color}"]`);
		if (colorInput) {
			document.getElementById('usePreset').checked = true;
			colorInput.checked = true;
		} else {
			document.getElementById('useCustom').checked = true;
			document.getElementById('customColor').value = rule.color || '#4285f4';
		}

		// Trigger color input update
		const event = new Event('change');
		if (colorInput) {
			document.getElementById('usePreset').dispatchEvent(event);
		} else {
			document.getElementById('useCustom').dispatchEvent(event);
		}

		editingRuleIndex = index;

		// Make sure form is visible and values are set
		requestAnimationFrame(() => {
			showAddRuleForm();
			// Scroll to bottom of the page
			window.scrollTo(0, document.body.scrollHeight);

			console.log('Form values after show:', {
				label: document.getElementById('labelName').value,
				sender: document.getElementById('sender').value,
				email: document.getElementById('email').value,
				subject: document.getElementById('subject').value,
				content: document.getElementById('content').value,
			});
		});
	});
}

function deleteRule(index) {
	if (confirm('Are you sure you want to delete this rule?')) {
		chrome.storage.sync.get('labelRules', function (data) {
			const rules = data.labelRules || [];
			rules.splice(index, 1);
			chrome.storage.sync.set({ labelRules: rules }, loadRules);
		});
	}
}

function exportRules() {
	chrome.storage.sync.get('labelRules', function (data) {
		const rules = data.labelRules || [];
		const json = JSON.stringify({ labelRules: rules }, null, 2);

		// Create a Blob containing the JSON data
		const blob = new Blob([json], { type: 'application/json' });

		// Create a temporary download link
		const downloadLink = document.createElement('a');
		downloadLink.href = URL.createObjectURL(blob);
		downloadLink.download = 'gmail-label-rules.json';

		// Append, click, and remove the link
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);

		// Clean up the URL object
		URL.revokeObjectURL(downloadLink.href);
	});
}

function saveImportedRules() {
	try {
		const data = JSON.parse(jsonDataArea.value);

		if (!data.labelRules || !Array.isArray(data.labelRules)) {
			throw new Error('Invalid format: missing labelRules array');
		}

		// Validate each rule
		data.labelRules.forEach((rule) => {
			if (!rule.label) {
				throw new Error('Each rule must have a label name');
			}
			if (!rule.sender && !rule.email && !rule.subject && !rule.content) {
				throw new Error('Each rule must have at least one condition');
			}
		});

		chrome.storage.sync.set({ labelRules: data.labelRules }, function () {
			hideImportExport();
			loadRules();
			alert('Rules imported successfully!');
		});
	} catch (error) {
		alert('Error importing rules: ' + error.message);
	}
}
