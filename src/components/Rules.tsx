import { useState, useEffect } from 'react';
import { LabelRule, StorageData } from '../types';

// Initial form state
const emptyRule: LabelRule = {
	label: '',
	color: '#4285f4',
	sender: '',
	email: '',
	subject: '',
	content: '',
};

const Rules: React.FC = () => {
	const [rules, setRules] = useState<LabelRule[]>([]);
	const [showAddForm, setShowAddForm] = useState(false);
	const [showImportExport, setShowImportExport] = useState(false);
	const [editingRules, setEditingRules] = useState<Set<number>>(new Set());
	const [newRule, setNewRule] = useState<LabelRule>(emptyRule);

	// Form states for each rule being edited
	const [formStates, setFormStates] = useState<{ [key: number]: LabelRule }>({});
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

	const handleSubmit = (index: number) => {
		const formData = formStates[index];
		if (!formData?.label) {
			alert('Label name is required!');
			return;
		}

		if (!formData.sender && !formData.email && !formData.subject && !formData.content) {
			alert('At least one matching condition is required!');
			return;
		}

		chrome.storage.sync.get('labelRules', (data: StorageData) => {
			const updatedRules = [...(data.labelRules || [])];
			updatedRules[index] = formData;

			chrome.storage.sync.set({ labelRules: updatedRules }, () => {
				const newEditingRules = new Set(editingRules);
				newEditingRules.delete(index);
				setEditingRules(newEditingRules);
				const newFormStates = { ...formStates };
				delete newFormStates[index];
				setFormStates(newFormStates);
				loadRules();
			});
		});
	};

	const handleEdit = (index: number) => {
		const newEditingRules = new Set(editingRules);
		if (newEditingRules.has(index)) {
			newEditingRules.delete(index);
			const newFormStates = { ...formStates };
			delete newFormStates[index];
			setFormStates(newFormStates);
		} else {
			newEditingRules.add(index);
			setFormStates({
				...formStates,
				[index]: { ...rules[index] },
			});
		}
		setEditingRules(newEditingRules);
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
		setFormStates({});
		setNewRule(emptyRule);
	};

	const handleAddRule = () => {
		if (!newRule.label) {
			alert('Label name is required!');
			return;
		}

		if (!newRule.sender && !newRule.email && !newRule.subject && !newRule.content) {
			alert('At least one matching condition is required!');
			return;
		}

		chrome.storage.sync.get('labelRules', (data: StorageData) => {
			const updatedRules = [...(data.labelRules || []), newRule];
			chrome.storage.sync.set({ labelRules: updatedRules }, () => {
				setShowAddForm(false);
				resetForm();
				loadRules();
			});
		});
	};

	const showImportExportForm = () => {
		setShowImportExport(true);
		setShowAddForm(false);
		setJsonData(JSON.stringify({ labelRules: rules }, null, 2));
	};

	return (
		<div className='max-w-3xl mx-auto p-5 font-sans w-full'>
			<h1 className='text-blue-500 mb-5 text-2xl font-semibold'>Gmail Label Rules</h1>

			{/* Main Buttons */}
			<div className='flex gap-2.5 my-5'>
				<button
					onClick={() => {
						setShowAddForm(true);
						setNewRule(emptyRule);
						setShowImportExport(false);
					}}
					className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600 font-semibold'
				>
					Add New Rule
				</button>
				<button
					onClick={showImportExportForm}
					className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600 font-semibold'
				>
					Import Rules
				</button>
				<button
					onClick={handleExport}
					className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600 font-semibold'
				>
					Export Rules
				</button>
			</div>

			{/* Add New Rule Form */}
			{showAddForm && (
				<div className='bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm'>
					<h2 className='text-gray-800 mb-4'>Add New Rule</h2>
					<div className='mb-4'>
						<label htmlFor='labelName' className='block mb-1 font-medium'>
							Label Name *
						</label>
						<input
							type='text'
							id='labelName'
							className='w-full p-2 border border-gray-200 rounded'
							value={newRule.label}
							onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
						/>
					</div>

					<div className='mb-4'>
						<label className='block mb-1 font-medium'>Label Color</label>
						<div className='flex gap-2.5 flex-wrap mt-2.5'>
							{presetColors.map((color) => (
								<label key={color} className='relative'>
									<input
										type='radio'
										name='labelColor'
										value={color}
										checked={newRule.color === color}
										onChange={(e) => setNewRule({ ...newRule, color: e.target.value })}
										className='absolute opacity-0 w-0 h-0'
									/>
									<span
										className='block w-6 h-6 rounded-full cursor-pointer border-2 border-transparent hover:border-gray-400'
										style={{
											backgroundColor: color,
											borderColor: newRule.color === color ? '#000' : 'transparent',
										}}
									></span>
								</label>
							))}
							<input
								type='color'
								className='w-24 p-1'
								value={newRule.color}
								onChange={(e) => setNewRule({ ...newRule, color: e.target.value })}
							/>
						</div>
					</div>

					<div className='mb-4'>
						<label htmlFor='sender' className='block mb-1 font-medium'>
							Sender Name (comma-separated)
						</label>
						<input
							type='text'
							id='sender'
							className='w-full p-2 border border-gray-200 rounded'
							value={newRule.sender}
							onChange={(e) => setNewRule({ ...newRule, sender: e.target.value })}
						/>
					</div>

					<div className='mb-4'>
						<label htmlFor='email' className='block mb-1 font-medium'>
							Email Address (comma-separated)
						</label>
						<input
							type='text'
							id='email'
							className='w-full p-2 border border-gray-200 rounded'
							value={newRule.email}
							onChange={(e) => setNewRule({ ...newRule, email: e.target.value })}
						/>
					</div>

					<div className='mb-4'>
						<label htmlFor='subject' className='block mb-1 font-medium'>
							Subject Contains (comma-separated)
						</label>
						<input
							type='text'
							id='subject'
							className='w-full p-2 border border-gray-200 rounded'
							value={newRule.subject}
							onChange={(e) => setNewRule({ ...newRule, subject: e.target.value })}
						/>
					</div>

					<div className='mb-4'>
						<label htmlFor='content' className='block mb-1 font-medium'>
							Content Contains (comma-separated)
						</label>
						<input
							type='text'
							id='content'
							className='w-full p-2 border border-gray-200 rounded'
							value={newRule.content}
							onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
						/>
					</div>

					<div className='flex gap-2.5 mt-5'>
						<button
							onClick={handleAddRule}
							className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
						>
							Save Rule
						</button>
						<button
							onClick={() => {
								setShowAddForm(false);
								resetForm();
							}}
							className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Rules List */}
			<div>
				{rules.length === 0 ? (
					<p>No rules found. Click "Add New Rule" to create one.</p>
				) : (
					rules.map((rule, index) => (
						<div
							key={index}
							className='bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm'
						>
							{editingRules.has(index) ? (
								<div>
									<h2 className='text-gray-800 mb-4'>Edit Rule {index + 1}</h2>
									<div className='mb-4'>
										<label htmlFor={`labelName-${index}`} className='block mb-1 font-medium'>
											Label Name *
										</label>
										<input
											type='text'
											id={`labelName-${index}`}
											className='w-full p-2 border border-gray-200 rounded'
											value={formStates[index]?.label || ''}
											onChange={(e) =>
												setFormStates({
													...formStates,
													[index]: { ...formStates[index], label: e.target.value },
												})
											}
										/>
									</div>

									<div className='mb-4'>
										<label className='block mb-1 font-medium'>Label Color</label>
										<div className='flex gap-2.5 flex-wrap mt-2.5'>
											{presetColors.map((color) => (
												<label key={color} className='relative'>
													<input
														type='radio'
														name={`labelColor-${index}`}
														value={color}
														checked={formStates[index]?.color === color}
														onChange={(e) =>
															setFormStates({
																...formStates,
																[index]: { ...formStates[index], color: e.target.value },
															})
														}
														className='absolute opacity-0 w-0 h-0'
													/>
													<span
														className='block w-6 h-6 rounded-full cursor-pointer border-2 border-transparent hover:border-gray-400'
														style={{
															backgroundColor: color,
															borderColor:
																formStates[index]?.color === color ? '#000' : 'transparent',
														}}
													></span>
												</label>
											))}
											<input
												type='color'
												className='w-24 p-1'
												value={formStates[index]?.color || '#4285f4'}
												onChange={(e) =>
													setFormStates({
														...formStates,
														[index]: { ...formStates[index], color: e.target.value },
													})
												}
											/>
										</div>
									</div>

									<div className='mb-4'>
										<label htmlFor={`sender-${index}`} className='block mb-1 font-medium'>
											Sender Name (comma-separated)
										</label>
										<input
											type='text'
											id={`sender-${index}`}
											className='w-full p-2 border border-gray-200 rounded'
											value={formStates[index]?.sender || ''}
											onChange={(e) =>
												setFormStates({
													...formStates,
													[index]: { ...formStates[index], sender: e.target.value },
												})
											}
										/>
									</div>

									<div className='mb-4'>
										<label htmlFor={`email-${index}`} className='block mb-1 font-medium'>
											Email Address (comma-separated)
										</label>
										<input
											type='text'
											id={`email-${index}`}
											className='w-full p-2 border border-gray-200 rounded'
											value={formStates[index]?.email || ''}
											onChange={(e) =>
												setFormStates({
													...formStates,
													[index]: { ...formStates[index], email: e.target.value },
												})
											}
										/>
									</div>

									<div className='mb-4'>
										<label htmlFor={`subject-${index}`} className='block mb-1 font-medium'>
											Subject Contains (comma-separated)
										</label>
										<input
											type='text'
											id={`subject-${index}`}
											className='w-full p-2 border border-gray-200 rounded'
											value={formStates[index]?.subject || ''}
											onChange={(e) =>
												setFormStates({
													...formStates,
													[index]: { ...formStates[index], subject: e.target.value },
												})
											}
										/>
									</div>

									<div className='mb-4'>
										<label htmlFor={`content-${index}`} className='block mb-1 font-medium'>
											Content Contains (comma-separated)
										</label>
										<input
											type='text'
											id={`content-${index}`}
											className='w-full p-2 border border-gray-200 rounded'
											value={formStates[index]?.content || ''}
											onChange={(e) =>
												setFormStates({
													...formStates,
													[index]: { ...formStates[index], content: e.target.value },
												})
											}
										/>
									</div>

									<div className='flex gap-2.5 mt-5'>
										<button
											onClick={() => handleSubmit(index)}
											className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
										>
											Save
										</button>
										<button
											onClick={() => handleEdit(index)}
											className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
										>
											Cancel
										</button>
									</div>
								</div>
							) : (
								<>
									<h3 className='mt-0 flex items-center gap-2'>
										<span
											className='w-3 h-3 rounded-full inline-block'
											style={{ backgroundColor: rule.color }}
										></span>
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
									<div className='flex gap-2.5 mt-2.5'>
										<button
											onClick={() => handleEdit(index)}
											className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
										>
											Edit
										</button>
										<button
											className='px-4 py-2 bg-red-500 text-white rounded border-none cursor-pointer hover:bg-red-600'
											onClick={() => handleDelete(index)}
										>
											Delete
										</button>
									</div>
								</>
							)}
						</div>
					))
				)}
			</div>

			{/* Import/Export Form */}
			{showImportExport && (
				<div className='bg-white border border-gray-200 rounded-lg p-5 mt-5 shadow-sm'>
					<h2 className='text-gray-800 mb-4'>Import/Export Rules</h2>
					<textarea
						value={jsonData}
						onChange={(e) => setJsonData(e.target.value)}
						rows={10}
						className='w-full box-border my-2.5 p-2 border border-gray-200 rounded font-mono'
					/>
					<div className='flex gap-2.5 mt-5'>
						<button
							onClick={handleImport}
							className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
						>
							Save
						</button>
						<button
							onClick={() => {
								setShowImportExport(false);
								setJsonData('');
							}}
							className='px-4 py-2 bg-blue-500 text-white rounded border-none cursor-pointer hover:bg-blue-600'
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
