const UNIVERSITY_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*(edu|ac)\.[a-zA-Z]{2,}$/;

function isUniversityEmail(email) {
	return UNIVERSITY_EMAIL_REGEX.test(String(email || '').toLowerCase());
}

function requireFields(obj, fields) {
	for (const field of fields) {
		if (!obj || typeof obj[field] === 'undefined' || obj[field] === null || obj[field] === '') {
			return field;
		}
	}
	return null;
}

module.exports = { isUniversityEmail, requireFields }; 