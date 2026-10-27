async function searchSong(artist, title) {
    //console.time('search');
    const response = await fetch('https://songbpm.com/searches', {
        method: 'POST',
        body: new URLSearchParams({ query: `${artist} ${title}` }),
    });
        
    const html = await response.text();
    //console.timeEnd('search'); to poll response time
    //console.log('status:', response.status);
    //console.log('final url:', response.url);
    //console.log('html start:', html.slice(0, 500));
    const match = html.match(/href="(\/@[^"]+)"/); //ooh regex ooh - so take data recieved (something like <a href = "/@abc/xyz-9999" class="...">), then start from href =, start remembering (the brackets indicate this), then /@, then keep remembering everything until the next " (the [^] means any character, and the + means one or more of those characters), then stop remembering when you hit the next " (the closing bracket indicates this). So we get the first match of this regex in the html string, which is the first song result

    return match ? `https://songbpm.com${match[1]}` : null; //match [0] is the whole match (href = bla bla), match [1] is what we regexed
    //if regex found nothing, return null, meaning no song found
}

async function getSongDetails(url) {
    const response = await fetch(url);
    const html = await response.text();

    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); //remove html tags

    // Small helper - run a regex on the text, return whats in the brackets (or null)
    function find(regex) {
        const match = text.match(regex);
        return match ? match[1] : null;
  }

  return {
    tempo: Number(find(/tempo of (\d+) BPM/)), //regex to find the tempo of the song in BPM
    key: find(/with an? (\S+) key/), //regex to find the key of the song
    mode: find(/an? (major|minor) mode/), 
    energy: find(/has (\w+) energy/),
    beatsPerBar: Number(find(/(\d+) beats per bar/)),
    vibe: find(/is an? (\w+) song/),
  };
}

function simplifyText(text){
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '');    //lowercase, remove non-alphanumeric characters, trim whitespace
}

async function getSongData(artist, title) {
    const url = await searchSong(artist, title);
    if (!url) {
        return null; //no song found, return null
    }
    const urlArtist = url.match(/\/@([^/]+)\//)[1]; //get the artist from the url (the part after /@ and before the next /) for verification

    if (!simplifyText(artist).includes(simplifyText(urlArtist))) return null; //songBPM ALWAYS returns something, here we verify its what we need (song names can differ the way they're written, but artist name is usually the same in both)
    return getSongDetails(url);
}

module.exports = { searchSong, getSongData, getSongDetails };