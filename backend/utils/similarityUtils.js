// Utility functions for text similarity calculation

/**
 * Calculate similarity between a search term and project titles
 * @param {string} searchTerm - The term to search for
 * @param {Array} projectTitles - Array of project objects with title property
 * @returns {Object} Similarity results
 */
function calculateSimilarity(searchTerm, projectTitles) {
    if (!searchTerm || !projectTitles || projectTitles.length === 0) {
        return {
            similarity: 0,
            bestMatch: null,
            allResults: []
        };
    }

    const normalizedSearchTerm = normalizeText(searchTerm);
    const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 2);
    
    let maxSimilarity = 0;
    let bestMatch = null;
    const allResults = [];

    for (const project of projectTitles) {
        const normalizedTitle = normalizeText(project.title);
        const titleWords = normalizedTitle.split(/\s+/).filter(word => word.length > 2);
        
        // Calculate Jaccard similarity
        const similarity = jaccardSimilarity(searchWords, titleWords);
        const similarityPercent = Math.round(similarity * 100);
        
        allResults.push({
            title: project.title,
            submittedBy: project.submittedBy,
            dateSubmitted: project.dateSubmitted,
            similarity: similarityPercent
        });
        
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = project.title;
        }
    }
    
    // Sort results by similarity (descending)
    allResults.sort((a, b) => b.similarity - a.similarity);
    
    return {
        similarity: Math.round(maxSimilarity * 100),
        bestMatch: bestMatch,
        allResults: allResults
    };
}

/**
 * Calculate Jaccard similarity between two sets of words
 * @param {Array} set1 - First set of words
 * @param {Array} set2 - Second set of words
 * @returns {number} Similarity score between 0 and 1
 */
function jaccardSimilarity(set1, set2) {
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Normalize text for comparison
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace non-word characters with spaces
        .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
        .trim();
}

/**
 * Remove common stop words from text
 * @param {string} text - Text to process
 * @returns {string} Text with stop words removed
 */
function removeStopWords(text) {
    const stopWords = [
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
        'to', 'was', 'will', 'with', 'or', 'but', 'not', 'this', 'they',
        'have', 'had', 'what', 'said', 'each', 'which', 'their', 'time',
        'if', 'up', 'out', 'so', 'said', 'what', 'up', 'use', 'way', 'about',
        'many', 'then', 'them', 'can', 'would', 'like', 'into', 'him', 'more',
        'two', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call',
        'who', 'oil', 'sit', 'now', 'find', 'long', 'down', 'day', 'did', 'get',
        'come', 'made', 'may', 'part'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    
    return filteredWords.join(' ');
}

/**
 * Calculate cosine similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function cosineSimilarity(str1, str2) {
    const words1 = normalizeText(str1).split(/\s+/);
    const words2 = normalizeText(str2).split(/\s+/);
    
    const wordSet = new Set([...words1, ...words2]);
    const vector1 = Array.from(wordSet).map(word => words1.filter(w => w === word).length);
    const vector2 = Array.from(wordSet).map(word => words2.filter(w => w === word).length);
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    return (magnitude1 && magnitude2) ? dotProduct / (magnitude1 * magnitude2) : 0;
}

module.exports = {
    calculateSimilarity,
    jaccardSimilarity,
    cosineSimilarity,
    normalizeText,
    removeStopWords
};
