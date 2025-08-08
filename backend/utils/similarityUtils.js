/**
 * Calculate similarity between search query and project titles
 */
function calculateSimilarity(query, titles) {
    const stopWords = ['a', 'an', 'the', 'is', 'of', 'and', 'using', 'for', 'in', 'on', 'at', 'to', 'with', 'by', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'];
    
    const cleanQuery = removeStopWords(query.toLowerCase().trim(), stopWords);
    let bestMatch = null;
    let highestSimilarity = 0;
    const allResults = [];
    
    titles.forEach(titleObj => {
        const title = typeof titleObj === 'string' ? titleObj : titleObj.title;
        const cleanTitle = removeStopWords(title.toLowerCase(), stopWords);
        
        // Use multiple similarity algorithms and take the highest
        const jaccardSim = wordOverlapSimilarity(cleanQuery, cleanTitle);
        const levenshteinSim = levenshteinSimilarity(cleanQuery, cleanTitle);
        const similarity = Math.max(jaccardSim, levenshteinSim);
        
        allResults.push({
            title: title,
            similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
            submittedBy: titleObj.submittedBy || 'Unknown',
            dateSubmitted: titleObj.dateSubmitted || null
        });
        
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = title;
        }
    });
    
    return {
        bestMatch,
        similarity: Math.round(highestSimilarity),
        allResults: allResults.sort((a, b) => b.similarity - a.similarity)
    };
}

/**
 * Remove stop words from text
 */
function removeStopWords(text, stopWords) {
    return text.split(' ')
        .filter(word => !stopWords.includes(word) && word.trim() !== '')
        .join(' ');
}

/**
 * Calculate word overlap similarity using Jaccard similarity
 */
function wordOverlapSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' ').filter(word => word.trim() !== ''));
    const words2 = new Set(text2.split(' ').filter(word => word.trim() !== ''));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    if (union.size === 0) return 0;
    return (intersection.size / union.size) * 100;
}

/**
 * Alternative: Levenshtein distance-based similarity
 */
function levenshteinSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);
    return ((maxLength - distance) / maxLength) * 100;
}

module.exports = {
    calculateSimilarity,
    removeStopWords,
    wordOverlapSimilarity,
    levenshteinSimilarity
};
