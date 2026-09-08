const BALANCE_STORAGE_KEY = 'petro-card-balance-progress-v1';
const ORIGINAL_CARD_VALUE_CENTS = 1000;

function classifyBalance(balanceCents) {
	if (balanceCents === null) return 'Not checked';
	if (balanceCents === 0) return 'Used';
	if (balanceCents === ORIGINAL_CARD_VALUE_CENTS) return 'Unused';
	if (balanceCents > 0 && balanceCents < ORIGINAL_CARD_VALUE_CENTS) return 'Partially used';
	return 'Check failed';
}

function parseBalance(value) {
	const normalized = String(value).replace(/[$,\s]/g, '');
	if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
	const cents = Math.round(Number(normalized) * 100);
	return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

function formatBalance(balanceCents) {
	return balanceCents === null ? '—' : `$${(balanceCents / 100).toFixed(2)}`;
}

function maskCardNumber(cardNumber) {
	const digits = String(cardNumber).replace(/\D/g, '');
	return digits.length >= 4 ? `••••••••••••${digits.slice(-4)}` : '••••';
}

function readSavedProgress() {
	try {
		const saved = JSON.parse(localStorage.getItem(BALANCE_STORAGE_KEY) || '{}');
		return saved && typeof saved === 'object' ? saved : {};
	} catch {
		return {};
	}
}

function saveProgress(results) {
	const safeProgress = {};
	results.forEach((result) => {
		if (!result.checked) return;
		safeProgress[result.storageId] = {
			index: result.index,
			cardSuffix: result.cardNumber.slice(-4),
			balanceCents: result.balanceCents,
			status: result.status,
			checked: true
		};
	});
	try {
		localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(safeProgress));
	} catch {
		// Storage may be unavailable in private browsing; session behavior still works.
	}
}

function restoreSavedProgress(result, savedProgress) {
	const saved = savedProgress[result.storageId];
	if (!saved || saved.cardSuffix !== result.cardNumber.slice(-4) || !saved.checked) return result;
	return {
		...result,
		balanceCents: Number.isSafeInteger(saved.balanceCents) ? saved.balanceCents : null,
		status: classifyBalance(saved.balanceCents),
		checked: true
	};
}

window.balanceTools = {
	classifyBalance,
	formatBalance,
	maskCardNumber,
	parseBalance,
	readSavedProgress,
	restoreSavedProgress,
	saveProgress
};
