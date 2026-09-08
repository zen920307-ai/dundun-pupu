import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { kv, wallpapers, festivals } from '../app/gallery-data.ts';
import {
  shuffledDeck,
  drawRound,
  fortunes,
  pokeLines,
  moodExtras,
  extraMissions,
  extraQuestions,
  chaosTags,
} from '../app/playful-content.ts';

test('each random pool is exhausted before repeating, including deck boundaries', () => {
  for (const size of [24, 32, 40]) {
    const draw = shuffledDeck(size, 0);
    let previous = 0;
    for (let round = 0; round < 100; round++) {
      const seen = new Set();
      for (let i = 0; i < size; i++) {
        const next = draw();
        assert.notEqual(next, previous);
        assert.ok(next >= 0 && next < size);
        assert.ok(!seen.has(next));
        seen.add(next);
        previous = next;
      }
      assert.equal(seen.size, size);
    }
  }
});
test('quiz rounds contain three different questions across a deck boundary', () => {
  const draw = shuffledDeck(36);
  for (let i = 0; i < 100; i++)
    assert.equal(new Set(drawRound(draw, 3)).size, 3);
});
test('expanded copy pools contain distinct content', () => {
  for (const pool of [
    fortunes,
    pokeLines,
    moodExtras.map((m) => m[1]),
    extraMissions.map((m) => m[0]),
    extraQuestions.map((q) => q.q),
    chaosTags,
  ])
    assert.equal(new Set(pool).size, pool.length);
  assert.equal(fortunes.length, 32);
  assert.equal(pokeLines.length, 40);
  assert.equal(moodExtras.length + 8, 24);
  assert.equal(extraMissions.length + 18, 40);
  assert.equal(extraQuestions.length + 8, 36);
  assert.equal(chaosTags.length, 36);
});
test('mood stickers exist as transparent png', () => {
  const names = [
    'mood-00',
    'mood-01',
    'mood-02',
    'mood-03',
    'mood-04',
    'mood-05',
    'mood-06',
    'mood-07',
    'mood-08',
    'mood-09',
    'mood-10',
    'mood-11',
    'dundun-head',
    'pupu-head',
    'dundun-sleep',
    'dundun-blank',
    'dundun-sad',
    'dundun-huh',
    'dundun-yawn',
  ];
  for (const name of names) {
    const data = readFileSync(
      new URL('../public/media/stickers/' + name + '.png', import.meta.url),
    );
    assert.equal(data[0], 0x89);
    assert.equal(data.toString('ascii', 1, 4), 'PNG');
  }
});

test('all gallery originals and thumbnails exist; originals are distinct', () => {
  assert.equal(kv.length, 21);
  assert.equal(wallpapers.length, 24);
  assert.equal(festivals.length, 14);
  const hashes = new Set();
  for (const item of [...kv, ...wallpapers, ...festivals]) {
    for (const path of [item.src, item.thumb]) {
      const data = readFileSync(new URL('../public' + path, import.meta.url));
      assert.equal(data.toString('ascii', 0, 4), 'RIFF', path);
      assert.equal(data.toString('ascii', 8, 12), 'WEBP', path);
      if (path === item.src) {
        const hash = createHash('sha256').update(data).digest('hex');
        assert.ok(!hashes.has(hash), 'duplicate original: ' + item.id);
        hashes.add(hash);
      }
    }
    assert.ok(item.title && item.tag);
    assert.ok(item.width > 0 && item.height > 0);
  }
});
