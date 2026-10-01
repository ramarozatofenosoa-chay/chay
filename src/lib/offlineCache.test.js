import assert from "node:assert/strict";
import test from "node:test";
import {
  isCacheStorageAvailable,
  getCachedJson,
  setCachedJson,
  deleteCachedJson,
  isUrlCached,
  cacheUrl,
  deleteCachedUrl,
  getCachedUrlAsObjectUrl,
} from "./offlineCache.js";

// L'environnement de test Node ne fournit pas l'API Cache Storage : toutes
// les fonctions doivent se dégrader silencieusement (pas d'exception) et
// renvoyer des valeurs neutres, plutôt que de faire planter l'appelant.
test("isCacheStorageAvailable is false in the Node test environment", () => {
  assert.equal(isCacheStorageAvailable(), false);
});

test("JSON cache helpers degrade gracefully without Cache Storage", async () => {
  assert.equal(await setCachedJson("key", { a: 1 }), false);
  assert.equal(await getCachedJson("key"), null);
  assert.equal(await deleteCachedJson("key"), false);
});

test("URL cache helpers degrade gracefully without Cache Storage", async () => {
  assert.equal(await isUrlCached("https://example.com/audio.mp3"), false);
  assert.equal(await cacheUrl("https://example.com/audio.mp3"), false);
  assert.equal(await deleteCachedUrl("https://example.com/audio.mp3"), false);
  assert.equal(await getCachedUrlAsObjectUrl("https://example.com/audio.mp3"), null);
});
