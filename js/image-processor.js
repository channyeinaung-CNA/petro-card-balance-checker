async function processImages(files, onProgress) {
	if (!window.Tesseract) {
		throw new Error('OCR library is unavailable. Check your connection and try again.');
	}

	let worker;
	const results = [];
	const total = files.length;

	try {
		worker = await window.Tesseract.createWorker('eng', 1, {
			logger: (message) => {
				if (message.status === 'recognizing text') {
					onProgress({ index: results.length, total, progress: message.progress, status: message.status });
				}
			}
		});

		for (let index = 0; index < total; index += 1) {
			const result = await worker.recognize(files[index]);
			results.push({
				text: result.data.text || '',
				confidence: Number.isFinite(result.data.confidence) ? result.data.confidence : 0
			});
			onProgress({ index, total, progress: 1, status: 'complete' });
		}

		return results;
	} finally {
		if (worker) {
			await worker.terminate();
		}
	}
}

window.processImages = processImages;
