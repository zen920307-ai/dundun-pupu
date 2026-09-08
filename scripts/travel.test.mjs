import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { trips } from '../app/travel/trips.ts';

// Every supplied travel image must have exactly one dated, readable diary.
const originals = readdirSync('../两只小可爱/旅行日记').filter(name => name.endsWith('.png')).map(name => name.slice(0, -4));
assert.deepEqual(trips.map(trip => trip.place).sort(), originals.sort());
assert.equal(new Set(trips.map(trip => trip.id)).size, trips.length);
for (const [index, trip] of trips.entries()) {
  assert.match(trip.date, /^\d{4}\.(0[1-9]|1[0-2])$/);
  if (index) assert.ok(trips[index - 1].date >= trip.date);
  assert.ok(trip.story.length >= 2 && trip.talk.length >= 3);
  for (const suffix of ['', '-thumb']) assert.ok(existsSync(`public/travel/${trip.place}${suffix}.webp`));
}
assert.equal(trips.at(-1).id, 'yunnan');
console.log(`Verified ${trips.length} diaries, dates, unique anchors and all travel assets.`);
