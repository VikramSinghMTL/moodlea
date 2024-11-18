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
	assessments.forEach((a, i) => {
		const option = document.createElement('option');
		option.value = i;
		option.textContent = `${a.name}`;
		select.appendChild(option);
	});
	modal.appendChild(select);

	// Input for handling empty grades
	const emptyLabel = document.createElement('label');
	emptyLabel.textContent = 'Value to use for empty grades:';
	emptyLabel.style.display = 'block';
	emptyLabel.style.marginBottom = '10px';
	modal.appendChild(emptyLabel);

	const emptyInput = document.createElement('input');
	emptyInput.type = 'text';
	emptyInput.placeholder = 'Leave empty for blanks';
	emptyInput.style.width = '100%';
	emptyInput.style.marginBottom = '10px';
	emptyInput.style.padding = '5px';
	emptyInput.style.fontSize = '16px';
	modal.appendChild(emptyInput);

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

				return `${id}\t${totalGrade}`;
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
