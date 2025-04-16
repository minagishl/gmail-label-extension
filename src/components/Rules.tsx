import { useState, useEffect } from 'react';
import { LabelRule, StorageData } from '../types';

const Rules = () => {
	const [rules, setRules] = useState<LabelRule[]>([]);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showImportExport, setShowImportExport] = useState(false);
	const [editingRuleIndex, setEditingRuleIndex] = useState<number>(-1);

	// Form state
	const [formData, setFormData] = useState<LabelRule>({
		label: '',
		color: '#4285f4',
		sender: '',
		email: '',
		subject: '',
		content: '',
	});
	const [useCustomColor, setUseCustomColor] = useState(false);
	const [jsonData, setJsonData] = useState('');

	const presetColors = ['#4285f4', '#ea4335', '#34a853', '#fbbc05', '#673ab7'];

	useEffect(() => {
		loadRules();
	}, []);

	const loadRules = () => {
		chrome.storage.sync.get('labelRules', (data: StorageData) => {
			setRules(data.labelRules || []);
		});
	};

	const handleSubmit = () => {
		if (!formData.label) {
			alert('Label name is required!');
			return;
		}

		if (!formData.sender && !formData.email && !formData.subject && !formData.content) {
			alert('At least one matching condition is required!');
			return;
		}

		chrome.storage.sync.get('labelRules', (data: StorageData) => {
			const updatedRules = [...(data.labelRules || [])];
			if (editingRuleIndex >= 0) {
				updatedRules[editingRuleIndex] = formData;
			} else {
				updatedRules.push(formData);
			}

			chrome.storage.sync.set({ labelRules: updatedRules }, () => {
				setShowAddForm(false);
				setEditingRuleIndex(-1);
				loadRules();
				resetForm();
			});
		});
	};

	const handleEdit = (index: number) => {
		setEditingRuleIndex(index);
		setFormData(rules[index]);
		setUseCustomColor(!presetColors.includes(rules[index].color));
		setShowAddForm(true);
		setShowImportExport(false);
	};

	const handleDelete = (index: number) => {
		if (confirm('Are you sure you want to delete this rule?')) {
			const updatedRules = [...rules];
			updatedRules.splice(index, 1);
			chrome.storage.sync.set({ labelRules: updatedRules }, loadRules);
		}
	};

	const handleExport = () => {
		const json = JSON.stringify({ labelRules: rules }, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const downloadLink = document.createElement('a');
		downloadLink.href = URL.createObjectURL(blob);
		downloadLink.download = 'gmail-label-rules.json';
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
		URL.revokeObjectURL(downloadLink.href);
	};

	const handleImport = () => {
		try {
			const data = JSON.parse(jsonData);

			if (!data.labelRules || !Array.isArray(data.labelRules)) {
				throw new Error('Invalid format: missing labelRules array');
			}

			data.labelRules.forEach((rule: LabelRule) => {
				if (!rule.label) {
					throw new Error('Each rule must have a label name');
				}
				if (!rule.sender && !rule.email && !rule.subject && !rule.content) {
					throw new Error('Each rule must have at least one condition');
				}
			});

			chrome.storage.sync.set({ labelRules: data.labelRules }, () => {
				setShowImportExport(false);
				setJsonData('');
				loadRules();
				alert('Rules imported successfully!');
			});
		} catch (error) {
			alert('Error importing rules: ' + (error as Error).message);
		}
	};

	const resetForm = () => {
		setFormData({
			label: '',
			color: '#4285f4',
			sender: '',
			email: '',
			subject: '',
			content: '',
		});
		setUseCustomColor(false);
	};

	const showImportExportForm = () => {
		setShowImportExport(true);
		setShowAddForm(false);
		setJsonData(JSON.stringify({ labelRules: rules }, null, 2));
	};

	return (
		<div className='rules-container'>
			<h1>Gmail Label Rules</h1>

			{/* Main Buttons */}
			<div className='main-actions'>
				<button onClick={() => setShowAddForm(true)}>Add New Rule</button>
				<button onClick={showImportExportForm}>Import Rules</button>
				<button onClick={handleExport}>Export Rules</button>
			</div>

			{/* Rules List */}
			<div className='rules-list'>
				{rules.length === 0 ? (
					<p>No rules found. Click "Add New Rule" to create one.</p>
				) : (
					rules.map((rule, index) => (
						<div key={index} className='rule-card'>
							<h3>
								<span className='color-dot' style={{ backgroundColor: rule.color }}></span>
								Rule {index + 1}: {rule.label}
							</h3>
							{rule.sender && (
								<p>
									<strong>Sender:</strong> {rule.sender}
								</p>
							)}
							{rule.email && (
								<p>
									<strong>Email:</strong> {rule.email}
								</p>
							)}
							{rule.subject && (
								<p>
									<strong>Subject contains:</strong> {rule.subject}
								</p>
							)}
							{rule.content && (
								<p>
									<strong>Content contains:</strong> {rule.content}
								</p>
							)}
							<div className='rule-actions'>
								<button onClick={() => handleEdit(index)}>Edit</button>
								<button className='delete-button' onClick={() => handleDelete(index)}>
									Delete
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{/* Add/Edit Rule Form */}
			{showAddForm && (
				<div className='form-container'>
					<h2>{editingRuleIndex >= 0 ? 'Edit Rule' : 'Add New Rule'}</h2>
					<div className='form-group'>
						<label htmlFor='labelName'>Label Name *</label>
						<input
							type='text'
							id='labelName'
							value={formData.label}
							onChange={(e) => setFormData({ ...formData, label: e.target.value })}
						/>
					</div>

					<div className='form-group'>
						<label>Label Color</label>
						<div>
							<label>
								<input
									type='radio'
									checked={!useCustomColor}
									onChange={() => setUseCustomColor(false)}
								/>
								Use preset color
							</label>
							<label>
								<input
									type='radio'
									checked={useCustomColor}
									onChange={() => setUseCustomColor(true)}
								/>
								Use custom color
							</label>
						</div>

						{!useCustomColor ? (
							<div className='color-options'>
								{presetColors.map((color) => (
									<label key={color} className='color-label-container'>
										<input
											type='radio'
											name='labelColor'
											value={color}
											checked={formData.color === color}
											onChange={(e) => setFormData({ ...formData, color: e.target.value })}
											className='color-option'
										/>
										<span className='color-label' style={{ backgroundColor: color }}></span>
									</label>
								))}
							</div>
						) : (
							<input
								type='color'
								value={formData.color}
								onChange={(e) => setFormData({ ...formData, color: e.target.value })}
							/>
						)}
					</div>

					<div className='form-group'>
						<label htmlFor='sender'>Sender Name (comma-separated)</label>
						<input
							type='text'
							id='sender'
							value={formData.sender}
							onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
						/>
					</div>

					<div className='form-group'>
						<label htmlFor='email'>Email Address (comma-separated)</label>
						<input
							type='text'
							id='email'
							value={formData.email}
							onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						/>
					</div>

					<div className='form-group'>
						<label htmlFor='subject'>Subject Contains (comma-separated)</label>
						<input
							type='text'
							id='subject'
							value={formData.subject}
							onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
						/>
					</div>

					<div className='form-group'>
						<label htmlFor='content'>Content Contains (comma-separated)</label>
						<input
							type='text'
							id='content'
							value={formData.content}
							onChange={(e) => setFormData({ ...formData, content: e.target.value })}
						/>
					</div>

					<div className='form-actions'>
						<button onClick={handleSubmit}>Save Rule</button>
						<button
							onClick={() => {
								setShowAddForm(false);
								setEditingRuleIndex(-1);
								resetForm();
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Import/Export Form */}
			{showImportExport && (
				<div className='import-export-container'>
					<h2>Import/Export Rules</h2>
					<textarea value={jsonData} onChange={(e) => setJsonData(e.target.value)} rows={10} />
					<div className='form-actions'>
						<button onClick={handleImport}>Save</button>
						<button
							onClick={() => {
								setShowImportExport(false);
								setJsonData('');
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Rules;
