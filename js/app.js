const imagePicker = document.querySelector('#image-picker');
const imageCount = document.querySelector('#image-count');
const previewGrid = document.querySelector('#preview-grid');
const clearButton = document.querySelector('#clear-button');
const processButton = document.querySelector('#process-button');
const statusMessage = document.querySelector('#status-message');
const resultsContainer = document.querySelector('#results-container');

let previewUrls = [];
let selectedImages = [];
let isProcessing = false;
let resultState = [];
let savedProgress = window.balanceTools.readSavedProgress();

function setStatus(message) {
	statusMessage.textContent = message;
}

function updateSelection(files) {
	previewUrls.forEach((url) => URL.revokeObjectURL(url));
	previewUrls = [];
	previewGrid.replaceChildren();

	const images = Array.from(files).filter((file) => file.type.startsWith('image/'));
	selectedImages = images;
	resultState = [];
	images.forEach((file, index) => {
		const url = URL.createObjectURL(file);
		previewUrls.push(url);

		const preview = document.createElement('div');
		preview.className = 'preview';
		const image = document.createElement('img');
		image.src = url;
		image.alt = `Selected screenshot ${index + 1}`;
		preview.append(image);
		previewGrid.append(preview);
	});

	imageCount.textContent = `${images.length} ${images.length === 1 ? 'image' : 'images'}`;
	clearButton.disabled = images.length === 0;
	processButton.disabled = images.length === 0;
	setStatus('');
	resultsContainer.innerHTML = '<div class="empty-results"><span class="empty-mark" aria-hidden="true">—</span><p>Extracted card details will appear here after image processing.</p></div>';
}

imagePicker.addEventListener('change', (event) => {
	updateSelection(event.target.files);
});

clearButton.addEventListener('click', () => {
	imagePicker.value = '';
	updateSelection([]);
});

function renderSummary() {
	const totals = resultState.reduce((summary, result) => {
		summary.total += 1;
		if (result.checked) summary.checked += 1;
		else summary.unchecked += 1;
		if (result.status === 'Used') summary.used += 1;
		if (result.status === 'Partially used') summary.partial += 1;
		if (result.status === 'Unused') summary.unused += 1;
		if (result.balanceCents !== null) summary.balanceCents += result.balanceCents;
		return summary;
	}, { total: 0, checked: 0, unchecked: 0, used: 0, partial: 0, unused: 0, balanceCents: 0 });

	const summary = document.querySelector('#balance-summary');
	if (!summary) return;
	summary.innerHTML = `
		<div><span>Total cards</span><strong>${totals.total}</strong></div>
		<div><span>Checked</span><strong>${totals.checked}</strong></div>
		<div><span>Unchecked</span><strong>${totals.unchecked}</strong></div>
		<div><span>Used</span><strong>${totals.used}</strong></div>
		<div><span>Partially used</span><strong>${totals.partial}</strong></div>
		<div><span>Unused</span><strong>${totals.unused}</strong></div>
		<div class="summary-total"><span>Total remaining</span><strong>${window.balanceTools.formatBalance(totals.balanceCents)}</strong></div>`;
}

function updateResult(result, field, value) {
	if (field === 'cardNumber') {
		result.cardNumber = value.replace(/\D/g, '');
		result.storageId = `screenshot-${result.index}-${result.cardNumber.slice(-4)}`;
	}
	if (field === 'securityCode') result.securityCode = value.replace(/\D/g, '').slice(0, 3);
	result.reviewEdited = true;
}

function renderResults() {
	resultsContainer.replaceChildren();
	const filter = document.querySelector('#status-filter')?.value || 'All';
	const sort = document.querySelector('#status-sort')?.value || 'original';
	const visibleResults = resultState
		.filter((result) => filter === 'All' || result.status === filter)
		.sort((first, second) => {
			if (sort === 'status') return first.status.localeCompare(second.status);
			if (sort === 'balance-high') return (second.balanceCents ?? -1) - (first.balanceCents ?? -1);
			return first.index - second.index;
		});

	if (visibleResults.length === 0) {
		resultsContainer.innerHTML = '<div class="empty-results"><span class="empty-mark" aria-hidden="true">—</span><p>No cards match this filter.</p></div>';
		return;
	}

	visibleResults.forEach((result) => {
		const card = document.createElement('article');
		card.className = 'result-card';
		card.innerHTML = `
			<div class="result-image-wrap"><img src="${previewUrls[result.index]}" alt="Screenshot ${result.index + 1}"></div>
			<div class="result-details">
				<div class="result-card-heading"><span class="result-label">Screenshot ${result.index + 1}</span><span class="review-badge"></span></div>
				<label>Card number<input class="result-input" data-field="cardNumber" inputmode="numeric" autocomplete="off" value="${result.cardNumber}"></label>
				<button class="copy-button" data-copy-field="cardNumber" type="button">Copy card number</button>
				<label>Security code<input class="result-input" data-field="securityCode" inputmode="numeric" autocomplete="off" maxlength="3" value="${result.securityCode}"></label>
				<button class="copy-button" data-copy-field="securityCode" type="button">Copy security code</button>
				<a class="checker-link" href="https://www.petro-canada.ca/en/personal/gift-cards/check-balance" target="_blank" rel="noopener">Open Petro-Canada balance checker <span aria-hidden="true">&#8599;</span></a>
				<label>Remaining balance<input class="result-input balance-input" data-field="balance" inputmode="decimal" autocomplete="off" placeholder="$0.00" value="${window.balanceTools.formatBalance(result.balanceCents) === '—' ? '' : window.balanceTools.formatBalance(result.balanceCents)}"></label>
				<div class="balance-status"><span>Balance status</span><strong>${result.status}</strong></div>
				<p class="review-reasons"></p>
			</div>`;

		const badge = card.querySelector('.review-badge');
		const reasons = card.querySelector('.review-reasons');
		let hasBeenEdited = false;
		const updateReviewState = () => {
			const cardValue = card.querySelector('[data-field="cardNumber"]').value.replace(/\D/g, '');
			const codeValue = card.querySelector('[data-field="securityCode"]').value.replace(/\D/g, '');
			const formatNeedsReview = cardValue.length < 8 || cardValue.length > 30 || codeValue.length !== 3;
			const needsReview = formatNeedsReview || (!hasBeenEdited && result.needsReview);
			badge.textContent = needsReview ? 'Manual review' : 'Ready to review';
			badge.className = `review-badge ${needsReview ? 'review-badge-warning' : 'review-badge-ready'}`;
			reasons.textContent = needsReview
				? (formatNeedsReview ? 'Check the highlighted values before continuing.' : result.reviewReasons.join('. '))
				: '';
		};
		card.querySelectorAll('.result-input').forEach((input) => input.addEventListener('input', () => {
			hasBeenEdited = true;
			updateResult(result, input.dataset.field, input.value);
			if (input.dataset.field === 'balance') {
				const balanceCents = window.balanceTools.parseBalance(input.value);
				result.balanceCents = balanceCents;
				result.checked = balanceCents !== null;
				result.status = window.balanceTools.classifyBalance(balanceCents);
				card.querySelector('.balance-status strong').textContent = result.status;
				window.balanceTools.saveProgress(resultState);
				renderSummary();
			}
			updateReviewState();
		}));
		card.querySelectorAll('.copy-button').forEach((button) => button.addEventListener('click', async () => {
			const value = card.querySelector(`[data-field="${button.dataset.copyField}"]`).value;
			if (!value) return;
			try {
				await navigator.clipboard.writeText(value);
				button.textContent = 'Copied';
				setTimeout(() => { button.textContent = `Copy ${button.dataset.copyField === 'cardNumber' ? 'card number' : 'security code'}`; }, 1200);
			} catch {
				button.textContent = 'Copy unavailable';
			}
		}));
		updateReviewState();
		resultsContainer.append(card);
	});
}

processButton.addEventListener('click', async () => {
	if (isProcessing || selectedImages.length === 0) return;
	isProcessing = true;
	processButton.disabled = true;
	clearButton.disabled = true;
	processButton.querySelector('span').textContent = 'Processing...';
	resultsContainer.innerHTML = '<div class="progress-panel"><strong>Preparing local OCR</strong><span id="ocr-progress">0%</span><div class="progress-track"><span id="ocr-progress-bar"></span></div></div>';

	try {
		const ocrResults = await window.processImages(selectedImages, ({ index, total, progress, status }) => {
			const percent = Math.round(((index + progress) / total) * 100);
			setStatus(`Reading screenshot ${index + 1} of ${total}...`);
			document.querySelector('#ocr-progress').textContent = `${percent}%`;
			document.querySelector('#ocr-progress-bar').style.width = `${percent}%`;
			if (status === 'complete') setStatus(`Finished screenshot ${index + 1} of ${total}.`);
		});
		resultState = ocrResults.map((result, index) => {
			const parsed = parseCardData(result.text, result.confidence);
			const baseResult = { ...parsed, index, balanceCents: null, status: 'Not checked', checked: false, storageId: `screenshot-${index}-${parsed.cardNumber.slice(-4)}` };
			return window.balanceTools.restoreSavedProgress(baseResult, savedProgress);
		});
		renderSummary();
		renderResults();
		setStatus('OCR complete. Check each result before using it.');
	} catch (error) {
		resultsContainer.innerHTML = '<div class="empty-results"><span class="empty-mark" aria-hidden="true">!</span><p>OCR could not be completed. Check your connection and try again.</p></div>';
		setStatus('OCR failed. Your images remain only in this browser.');
	} finally {
		isProcessing = false;
		processButton.disabled = selectedImages.length === 0;
		clearButton.disabled = selectedImages.length === 0;
		processButton.querySelector('span').textContent = 'Process images';
	}
});

document.querySelector('#status-filter')?.addEventListener('change', renderResults);
document.querySelector('#status-sort')?.addEventListener('change', renderResults);

window.addEventListener('beforeunload', () => {
	previewUrls.forEach((url) => URL.revokeObjectURL(url));
});
