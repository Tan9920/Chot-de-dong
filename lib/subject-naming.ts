export function canonicalSubjectName(input = '') { const text = String(input || '').trim(); return /kĩ thuật|kỹ thuật/i.test(text) ? 'Công nghệ' : text; }
export function resolveSubjectName(input = '') { const canonical = canonicalSubjectName(input); return { input, canonical, changed: canonical !== input, warning: canonical !== input ? 'Tên môn đã được chuẩn hóa sang Công nghệ.' : '' }; }
export function normalizeSubjectPayload(payload: any) { return { ...payload, subject: canonicalSubjectName(payload?.subject) }; }
