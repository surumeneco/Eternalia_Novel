/**
 * Domain shape for a single word's independently identified meanings.
 * Etymologies belong to a meaning (not merely to a spelling or part of speech).
 */
export interface WordEtymology {
    id: string;
    languageId?: string;
    wordId?: string;
    note: string;
    languageTitle?: string;
    wordTitle?: string;
}
export interface WordMeaning {
    id: string;
    partOfSpeech: string;
    definition: string;
    etymologies: WordEtymology[];
}
export declare function parseWordMeanings(raw: string): WordMeaning[];
/**
 * Proposed content of a rejected duplicate word is kept in the existing word's
 * local editor buffer. Never writes the library or its published snapshot.
 */
export declare function appendDuplicateWordMeaning(raw: string, entry: {
    id: string;
    partOfSpeech: string;
    definition: string;
}): string;
