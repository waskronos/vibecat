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
    return bestMatch;   
}

function parseLyrics(bestMatch) {
    const lines = bestMatch.syncedLyrics.split('\n'); //get the best match lyrics and then split each line in synced lyric sectrion of json doc
    const parsed = [];

    for (const line of lines) {
        // numero uno 1. does this line look like "[mm:ss.xx] text"?
        const match = line.match(/\[(\d+):(\d+\.\d+)\]\s*(.*)/); //regex ooga booga to match time in [ brackets ]
        if (!match) continue;

        // numero dos 2. unpack the pieces from the MATCH
        const [, minutes, seconds, text] = match; //match[0] is always the whole match, 1, 2 and 3 indexes are the values

        // numero tres 3. work out the time in milliseconds
        const time = (Number(minutes) * 60 + Number(seconds)) * 1000;

        // numero cuatro 4. a cleaned copy of the text, just for comparing
        const clean = text
            .toLowerCase() //in case words are capitalized differently, we lowercase everything
            .replace(/\(.*?\)/g, '') // adlibs or parenthetical stuff, remove it (Oh oh oh)
            .replace(/[^\p{L}\p{N} ]/gu, '') // punctuation, redundant spaces etc, no need for it to compare
            .trim(); // remove whitespace from start and end of string

        // and numero cinco 5. keep all three, even if the text is empty
        parsed.push({ time, text, clean });
    }
    return parsed;
}

const MIN_BLOCK = 3; //minimum number of lines that must repeat to be considered a chorus

function findChorus(parsedLyrics, songDuration) {
    const sung =  parsedLyrics.filter(l => l.clean !== ''); //filter out empty lines, we only want sung lines
    const used = new Array(sung.length).fill(false); //nothing crossed out yet (we will skip used lines when checking for chorus repeats)
    const sections = [];


    while(true){
            let best = { start: 0, length: 0 };
        //---LOOP 1 - FIND THE CHORUS (THE longest repeating block)---
        for (let i = 0; i < sung.length; i++) {
                for (let j = i + 1; j < sung.length; j++) {
                    let n = 0;
                    while(
                        j + n < sung.length &&
                        i + n < j &&
                        !used[i + n] && !used[j + n] && //check if we have already crossed the two lines out
                        sung[i + n].clean === sung[j + n].clean
                    ){
                    n++;
                    }
                    if (n > best.length) {
                        best = { start: i, length: n };
                    }
                }
            }
            
        if (best.length < MIN_BLOCK) break;   // nothing big enough left so you can skip

        //---LOOP 2 - FIND EVERY COPY OF THE CHORUS IN THE SONG---

        const sungChorus = sung.slice(best.start, best.start + best.length).map(l => l.clean); //take the chorus you found as a list of clean strings  

        for(let k = 0; k + 1 < sung.length; k++) {
            if(used[k]) continue; //if line was a part of chorus, then you good to go

            const j = sungChorus.indexOf(sung[k].clean);
            //is this line in BIG chorus?? yeah? what position 

            if (j === -1 || sung[k + 1].clean !== sungChorus[j + 1]) continue; //if the line is not in chorus, or the next line is not the next line in chorus, skip (probably not the chorus then)

            let n = 2; //two lines matched ^^ so start after that
            while( //make sure we dont go out of bounds, and that the next lines match
                j + n < sungChorus.length &&
                k + n < sung.length &&
                !used[k + n] && //check if we have already crossed the two lines out
                sung[k + n].clean === sungChorus[j + n] //sungchorus is already cleaned
            ){
                n++;
            }
            
            const first = sung[k];
            const last = sung[k + n - 1];
            const next = parsedLyrics.find(l => l.time > last.time); 
            sections.push({ start: first.time, end: next ? next.time : songDuration }); 

            for(m = k; m < k + n; m++) used[m] = true; //cross out the lines that were part of the chorus so we dont find them again
            k += n - 1; //end time is the last line's time, not the next line's time, so we subtract 1 from n
            //skip to the end of this chorus section, so we dont find it again

        } //this is in case the chorus is repeated but not every line, so we check on a per line basis - sometimes only parts of the chorus are repeated, and lines change. We try to find as much as we can but this can be a very outlier case
    }
    return sections.sort((a, b) => a.start - b.start); //sort the sections by start time so they are in order
}

module.exports = { findBest, searchLyrics, parseLyrics, findChorus };