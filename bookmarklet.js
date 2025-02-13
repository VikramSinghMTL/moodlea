(function () {
	let extractedData = '';

	// Select the Moodle grade table
	const gradeTable = document.querySelector('#user-grades');
	if (!gradeTable) {
		alert('This bookmarklet only works on the Moodle gradebook page.');
		return;
	}

	// Get headers for all grade items
	const headers = Array.from(
		gradeTable.querySelectorAll('th[data-itemid] a.gradeitemheader')
	);

	if (!headers.length) {
		alert('No assessments found in the gradebook.');
		return;
	}

	// Map assessments with names and IDs
	const assessments = headers.map((link) => ({
		name: link.getAttribute('title') || link.textContent.trim(),
		itemid: link.closest('th').getAttribute('data-itemid'),
	}));

	// Remove existing modal if already open
	let modal = document.getElementById('assessmentModal');
	if (modal) {
		modal.remove();
	}

	// Create the modal
	modal = document.createElement('div');
	modal.id = 'assessmentModal';
	modal.style.position = 'fixed';
	modal.style.top = '10%';
	modal.style.left = '50%';
	modal.style.transform = 'translate(-50%, 0)';
	modal.style.backgroundColor = '#fff';
	modal.style.border = '1px solid #ccc';
	modal.style.borderRadius = '10px';
	modal.style.padding = '20px';
	modal.style.zIndex = '10000';
	modal.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

	// Label for multi-selection
	const label = document.createElement('label');
	label.textContent =
		'Select assessments to sum, CTRL/CMD click to select multiple:';
	label.style.display = 'block';
	label.style.marginBottom = '10px';
	modal.appendChild(label);

	// Multi-select box
	const select = document.createElement('select');
	select.multiple = true;
	select.style.width = '100%';
	select.style.marginBottom = '10px';
	select.style.padding = '5px';
	select.style.fontSize = '16px';
	select.style.height = '40vh'; // Adjust height dynamically with max cap
	select.style.overflowY = 'auto'; // Add scrollbar if content exceeds max height
	select.style.display = 'block';
	assessments.forEach((a, i) => {
		const option = document.createElement('option');
		option.value = i;
		option.textContent = `${a.name}`;
		select.appendChild(option);
	});
	modal.appendChild(select);

	// Add container styles to align label and input
	function createInputRow(label, input) {
		const row = document.createElement('div');
		row.style.display = 'flex';
		row.style.alignItems = 'center';
		row.style.justifyContent = 'space-between';
		row.style.marginBottom = '15px';
		row.appendChild(label);
		row.appendChild(input);
		return row;
	}

	// Input for handling empty grades
	const emptyLabel = document.createElement('label');
	emptyLabel.textContent = 'Value for empty grades:';
	emptyLabel.style.fontSize = '16px';

	const emptyInput = document.createElement('input');
	emptyInput.type = 'text';
	emptyInput.placeholder = 'Leave blank for empty.';
	emptyInput.style.padding = '5px';
	emptyInput.style.fontSize = '14px';
	emptyInput.style.flex = '1'; // Ensures input stretches within row
	emptyInput.style.marginLeft = '10px';

	// Add to modal
	modal.appendChild(createInputRow(emptyLabel, emptyInput));

	// Input for rounding decimal places
	const roundingLabel = document.createElement('label');
	roundingLabel.textContent = 'Decimal places:';
	roundingLabel.style.fontSize = '16px';

	const roundingInput = document.createElement('input');
	roundingInput.type = 'number';
	roundingInput.placeholder = 'Leave blank for none.';
	roundingInput.style.padding = '5px';
	roundingInput.style.fontSize = '14px';
	roundingInput.style.flex = '1';
	roundingInput.style.marginLeft = '10px';

	// Add to modal
	modal.appendChild(createInputRow(roundingLabel, roundingInput));

	// Toggle for including student ID
	const toggleLabel = document.createElement('label');
	toggleLabel.textContent = 'Include Student ID:';
	toggleLabel.style.fontSize = '16px';

	// Create slider toggle
	const toggleWrapper = document.createElement('div');
	toggleWrapper.style.position = 'relative';
	toggleWrapper.style.width = '40px';
	toggleWrapper.style.height = '20px';
	toggleWrapper.style.backgroundColor = '#007bff';
	toggleWrapper.style.borderRadius = '20px';
	toggleWrapper.style.cursor = 'pointer';
	toggleWrapper.style.marginLeft = '10px';

	const toggleInput = document.createElement('input');
	toggleInput.type = 'checkbox';
	toggleInput.checked = true; // Default to include ID
	toggleInput.style.opacity = '0';
	toggleInput.style.width = '0';
	toggleInput.style.height = '0';
	toggleInput.style.position = 'absolute';

	const toggleIndicator = document.createElement('span');
	toggleIndicator.style.position = 'absolute';
	toggleIndicator.style.top = '2px';
	toggleIndicator.style.left = '2px';
	toggleIndicator.style.width = '16px';
	toggleIndicator.style.height = '16px';
	toggleIndicator.style.backgroundColor = 'white';
	toggleIndicator.style.borderRadius = '50%';
	toggleIndicator.style.transition = 'all 0.3s';
	toggleIndicator.style.transform = 'translateX(20px)';

	// Handle click events on toggleWrapper
	toggleWrapper.addEventListener('click', () => {
		toggleInput.checked = !toggleInput.checked; // Toggle the checkbox state
		if (toggleInput.checked) {
			toggleWrapper.style.backgroundColor = '#007bff';
			toggleIndicator.style.transform = 'translateX(20px)';
		} else {
			toggleWrapper.style.backgroundColor = '#ccc';
			toggleIndicator.style.transform = 'translateX(0)';
		}
	});

	toggleWrapper.appendChild(toggleInput);
	toggleWrapper.appendChild(toggleIndicator);

	// Add to modal
	modal.appendChild(createInputRow(toggleLabel, toggleWrapper));

	// Dismiss modal functionality
	const dismissButton = document.createElement('button');
	dismissButton.textContent = '×';
	dismissButton.style.position = 'absolute';
	dismissButton.style.top = '-5px';
	dismissButton.style.right = '0';
	dismissButton.style.background = 'none';
	dismissButton.style.border = 'none';
	dismissButton.style.fontSize = '20px';
	dismissButton.style.cursor = 'pointer';

	// Remove modal on click
	dismissButton.onclick = () => modal.remove();
	modal.appendChild(dismissButton);

	// Dismiss modal by clicking outside
	document.addEventListener('click', (event) => {
		if (!modal.contains(event.target)) {
			modal.remove();
		}
	});

	// Extract grades button
	const button = document.createElement('button');
	button.textContent = 'Extract Grades';
	button.style.display = 'block';
	button.style.width = '100%';
	button.style.padding = '10px';
	button.style.backgroundColor = '#007bff';
	button.style.color = '#fff';
	button.style.border = 'none';
	button.style.borderRadius = '5px';
	button.style.cursor = 'pointer';

	// Button onclick handler
	button.onclick = function () {
		// Get selected assessments and empty grade value
		const selectedIndexes = Array.from(select.selectedOptions).map(
			(option) => parseInt(option.value)
		);
		const selectedAssessments = selectedIndexes.map(
			(index) => assessments[index]
		);
		const emptyValue = emptyInput.value.trim();
		const roundingPlaces = parseInt(roundingInput.value.trim(), 10);

		modal.remove();

		// Extract grades
		const rows = Array.from(gradeTable.querySelectorAll('tr'));
		const gradeData = rows
			.map((row) => {
				const idCell = row.querySelector('td.cell.c1');
				if (!idCell) return null;

				const id = idCell.textContent.trim().split('@')[0];
				if (id === '-') return null;

				let totalGrade = 0;
				let hasValidGrade = false;

				selectedAssessments.forEach((assessment) => {
					const gradeCell = row.querySelector(
						`td[data-itemid="${assessment.itemid}"]`
					);
					let grade = 0;

					if (gradeCell) {
						// Check for input field in edit mode
						if (gradeCell.querySelector('input')) {
							grade =
								parseFloat(
									gradeCell.querySelector('input').value
								) ||
								parseFloat(emptyValue) ||
								0;
						} else {
							// Check for grade value in view mode
							const gradeValue =
								gradeCell.querySelector('.gradevalue');
							grade = parseFloat(
								gradeValue
									? gradeValue.textContent
											.trim()
											.replace('%', '')
									: emptyValue || 0
							);
						}
						if (!isNaN(grade)) {
							hasValidGrade = true;
							totalGrade += grade;
						}
					}
				});

				if (!hasValidGrade) {
					totalGrade = emptyValue || '';
				}

				const roundedGrade =
					typeof totalGrade === 'number' && !isNaN(totalGrade)
						? totalGrade.toFixed(roundingPlaces)
						: totalGrade;

				return toggleInput.checked
					? `${id}\t${roundedGrade}`
					: `${roundedGrade}`;
			})
			.filter((row) => row !== null)
			.join('\n');

		if (!gradeData) {
			alert('No grades found for the selected assessments.');
			return;
		}

		// Copy to clipboard
		extractedData = gradeData;
		navigator.clipboard
			.writeText(extractedData)
			.then(() => {
				alert(
					'Grades copied to clipboard. Navigate to Lea and paste them into the textarea.'
				);
				console.log('Extracted Grades:\n' + extractedData);
			})
			.catch((err) => {
				console.error('Failed to copy to clipboard:', err);
				alert(
					'Failed to copy grades to clipboard. Check the console for details.'
				);
			});
	};

	modal.appendChild(button);
	document.body.appendChild(modal);
})();
