const MAX_DIFF = 2;

async function searchLyrics(artist, title) {
    const urlparams = new URLSearchParams({
        artist_name: artist,
        track_name: title
    });
    const url = `https://lrclib.net/api/search?${urlparams.toString()}`;

    const response = await fetch(url, { headers: { 'User-Agent': 'Vibecat (student personal project)' } });
    if(!response.ok) {
        throw new Error(`Lyrics search failed: ${response.status} ${response.statusText}`);
    }
    const results = await response.json();
    if (!Array.isArray(results)) {
        throw new Error(`Lyrics search returned unexpected data: ${typeof results}`);
    }

    return results;
}

function findBest(results, windowsSeconds, allowLoose = false) {
    let bestMatch = null;
    let bestScore = Infinity;

    for (const result of results) {
        const score = Math.abs(result.duration - windowsSeconds);
        if (score < bestScore) {
            bestScore = score;
            bestMatch = result;
        }
    }

    if (!bestMatch) return null; // no results found
    const off = Math.abs(bestMatch.duration - windowsSeconds);
    if (off > MAX_DIFF && !allowLoose){
        console.warn(`Best match is ${off.toFixed(1)}s off, skipping...`);
        return null;
    }
    return bestMatch;   // null if the list was empty
}

module.exports = { searchLyrics, findBest };

module.exports = { findBest, searchLyrics };