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
module.exports = { searchSong };