const db = require('./firebase');
const { ref, get, set } = require('firebase/database');

// Firebase keys can't contain . # $ [ ] /, so swap those for _
function trackKey(artist, title) {
  return `${artist}|${title}`.toLowerCase().replace(/[.#$[\]/]/g, '_');
}

// Returns the saved data, or undefined if this song has never been looked up.
async function getCached(artist, title) {
  const result = await get(ref(db, `tracks/${trackKey(artist, title)}`));
  return result.exists() ? result.val() : undefined;
}

// Saves what songbpm told us, including "not found", so we never ask twice.
async function saveToCache(artist, title, data) {
  const entry = data
    ? { ...data, source: 'songbpm', savedAt: Date.now() }
    : { notFound: true, savedAt: Date.now() };
  await set(ref(db, `tracks/${trackKey(artist, title)}`), entry);
}

module.exports = { getCached, saveToCache };