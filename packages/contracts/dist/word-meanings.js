const identifier = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function invalid(message) {
    throw { code: 'bad-request', message };
}
function boundedText(value, maximum, label) {
    if (typeof value !== 'string' || value.length > maximum)
        invalid(label + 'の形式が不正です。');
    return value.trim();
}
function reference(value, label) {
    if (value === undefined || value === null || value === '')
        return undefined;
    if (typeof value !== 'string' || !identifier.test(value))
        invalid(label + 'が不正です。');
    return value;
}
export function parseWordMeanings(raw) {
    let decoded;
    try {
        decoded = JSON.parse(raw);
    }
    catch {
        invalid('単語の意味データがJSONではありません。');
    }
    if (!Array.isArray(decoded) || decoded.length > 30)
        invalid('意味は最大30件です。');
    const ids = new Set();
    return decoded.map((input) => {
        if (!input || typeof input !== 'object' || Array.isArray(input))
            invalid('意味データが不正です。');
        const value = input;
        const id = reference(value.id, '意味ID');
        if (!id || ids.has(id))
            invalid('意味IDが欠落または重複しています。');
        ids.add(id);
        const partOfSpeech = boundedText(value.partOfSpeech ?? '', 80, '品詞');
        const definition = boundedText(value.definition ?? '', 2000, '意味');
        if (!partOfSpeech && !definition)
            invalid('意味または品詞を入力してください。');
        if (!Array.isArray(value.etymologies) || value.etymologies.length > 12) {
            invalid('語源は意味ごとに最大12件です。');
        }
        const etymologyIds = new Set();
        const etymologies = value.etymologies.map((source) => {
            if (!source || typeof source !== 'object' || Array.isArray(source))
                invalid('語源の形式が不正です。');
            const etymology = source;
            const etymologyId = reference(etymology.id, '語源ID');
            if (!etymologyId || etymologyIds.has(etymologyId))
                invalid('語源IDが欠落または重複しています。');
            etymologyIds.add(etymologyId);
            const languageId = reference(etymology.languageId, '語源の言語ID');
            const wordId = reference(etymology.wordId, '語源の単語ID');
            if (wordId && !languageId)
                invalid('語源の参照語には参照言語が必要です。');
            const note = boundedText(etymology.note ?? '', 1000, '語源の説明');
            if (!languageId && !note)
                invalid('語源には参照先または説明が必要です。');
            return { id: etymologyId, ...(languageId ? { languageId } : {}),
                ...(wordId ? { wordId } : {}), note };
        });
        return { id, partOfSpeech, definition, etymologies };
    });
}
/**
 * Proposed content of a rejected duplicate word is kept in the existing word's
 * local editor buffer. Never writes the library or its published snapshot.
 */
export function appendDuplicateWordMeaning(raw, entry) {
    const existing = parseWordMeanings(raw || '[]');
    if (existing.length >= 30)
        invalid('この単語に登録できる意味は最大30件です。');
    if (!identifier.test(entry.id) || existing.some(meaning => meaning.id === entry.id)) {
        invalid('追加入力の意味IDが不正です。');
    }
    const partOfSpeech = boundedText(entry.partOfSpeech, 80, '品詞');
    const definition = boundedText(entry.definition, 2000, '意味');
    const append = { id: entry.id, partOfSpeech, definition, etymologies: [] };
    // Same-POS meanings should stay together, without changing their original IDs/order.
    let lastMatch = -1;
    for (let index = 0; index < existing.length; index++) {
        if (existing[index]?.partOfSpeech === partOfSpeech)
            lastMatch = index;
    }
    existing.splice(lastMatch >= 0 ? lastMatch + 1 : existing.length, 0, append);
    return JSON.stringify(existing);
}
