const CARD_MIN_LENGTH = 8;
const CARD_MAX_LENGTH = 30;
const LOW_CONFIDENCE_THRESHOLD = 70;

function normalizeWhitespace(text) {
	return text.replace(/\s+/g, ' ').trim();
}

function normalizeCandidate(candidate) {
	return candidate
		.toUpperCase()
		.replace(/[OQ]/g, '0')
		.replace(/[IL]/g, '1')
		.replace(/S/g, '5')
		.replace(/[^0-9]/g, '');
}

function findLabelValue(text, labelPattern, nextLabelPattern) {
	const normalized = normalizeWhitespace(text);
	const pattern = new RegExp(`${labelPattern}\\s*[:#.-]?\\s*([A-Z0-9 -]{3,})`, 'i');
	const match = normalized.match(pattern);
	if (!match) {
		return { value: '', found: false, corrected: false };
	}

	let candidate = match[1];
	if (nextLabelPattern) {
		candidate = candidate.split(new RegExp(nextLabelPattern, 'i'))[0];
	}
	const corrected = /[OQILS]/i.test(candidate);
	return { value: candidate.trim(), found: true, corrected };
}

function parseCardData(ocrText, confidence = 0) {
	const cardMatch = findLabelValue(ocrText, 'card\\s*(?:number|no\\.?|#)', 'security\\s*code|security\\s*no\\.?');
	const securityMatch = findLabelValue(ocrText, 'security\\s*(?:code|no\\.?)', 'card\\s*(?:number|no\\.?|#)');
	const cardNumber = normalizeCandidate(cardMatch.value);
	const securityCode = normalizeCandidate(securityMatch.value);
	const reviewReasons = [];

	if (!cardMatch.found) reviewReasons.push('Card number label not found');
	if (!cardNumber || cardNumber.length < CARD_MIN_LENGTH || cardNumber.length > CARD_MAX_LENGTH) reviewReasons.push('Card number needs checking');
	if (cardMatch.corrected) reviewReasons.push('Some card number characters were interpreted by OCR');
	if (!securityMatch.found || securityCode.length !== 3) reviewReasons.push('Security code needs checking');
	if (securityMatch.corrected) reviewReasons.push('Some security code characters were interpreted by OCR');
	if (confidence < LOW_CONFIDENCE_THRESHOLD) reviewReasons.push('OCR confidence is low');

	return {
		cardNumber,
		securityCode: securityCode.length === 3 ? securityCode : securityCode.slice(0, 3),
		confidence,
		needsReview: reviewReasons.length > 0,
		reviewReasons
	};
}

window.parseCardData = parseCardData;
