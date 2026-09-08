const imagePicker = document.querySelector('#image-picker');
const imageCount = document.querySelector('#image-count');
const previewGrid = document.querySelector('#preview-grid');
const clearButton = document.querySelector('#clear-button');
const processButton = document.querySelector('#process-button');
const statusMessage = document.querySelector('#status-message');

let previewUrls = [];

function updateSelection(files) {
	previewUrls.forEach((url) => URL.revokeObjectURL(url));
	previewUrls = [];
	previewGrid.replaceChildren();

	const images = Array.from(files).filter((file) => file.type.startsWith('image/'));
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
	statusMessage.textContent = '';
}

imagePicker.addEventListener('change', (event) => {
	updateSelection(event.target.files);
});

clearButton.addEventListener('click', () => {
	imagePicker.value = '';
	updateSelection([]);
});

processButton.addEventListener('click', () => {
	statusMessage.textContent = 'Images are ready. OCR will be added in Stage 2.';
});

window.addEventListener('beforeunload', () => {
	previewUrls.forEach((url) => URL.revokeObjectURL(url));
});
