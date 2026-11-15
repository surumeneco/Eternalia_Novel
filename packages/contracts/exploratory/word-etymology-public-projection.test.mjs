/** LG-05/06 and PB-10/15/18: per-meaning etymology projection, draft/public isolation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  newLibrary, createNode, editNode, publishNode, setVisibility, toReader,
} from '../dist/index.js';

const now = Date.UTC(2026, 10, 15, 0, 0, 0);
const contents = (title, details = {}) => ({ title, body: title + ' author body', details });
const get = (db, id) => db.nodes.find(n => n.id === id);
const meaningList = (db, wordId, at) =>
  JSON.parse(toReader(db, wordId, at).content.details.meanings);

test('ETYM-PUBLIC-01/02/03: meaning-bound references hide private ancestry and use published labels only', () => {
  let db = newLibrary();
  const add = (kind, parentId, title) => {
    const id = randomUUID();
    db = createNode(db, { id, kind, parentId, content: contents(title), now });
    return id;
  };
  const series = add('series', null, 'World');
  const langA = add('language', series, 'Native Language');
  const langB = add('language', series, 'Foreign Language');
  const source = add('word', langA, 'Source Word');
  const refA = add('word', langA, 'Native Reference');
  const refB = add('word', langB, 'Foreign Reference');

  for (const id of [series, langA, langB, source, refA, refB]) {
    db = publishNode(db, id, 1, now);
  }

  const [m1, m2, eB, eA, eNote] = Array.from({ length: 5 }, () => randomUUID());
  const meanings = [
    { id: m1, partOfSpeech: '名詞', definition: 'first independent meaning',
      etymologies: [{ id: eB, languageId: langB, wordId: refB, note: 'shared root' }] },
    { id: m2, partOfSpeech: '名詞', definition: 'second independent meaning',
      etymologies: [
        { id: eA, languageId: langA, wordId: refA, note: 'native root' },
        { id: eNote, note: 'independent reconstructed origin' },
      ] },
  ];
  db = editNode(db, source, 1,
    contents('Source Word', { meanings: JSON.stringify(meanings) }), now + 1);
  assert.equal(get(db, source)?.revision, 2);
  db = publishNode(db, source, 2, now + 2);
  let projected = meaningList(db, source, now + 3);
  assert.deepEqual(projected.map(m => [m.id, m.partOfSpeech, m.definition]), [
    [m1, '名詞', 'first independent meaning'],
    [m2, '名詞', 'second independent meaning'],
  ]);
  assert.deepEqual(projected.map(m => m.etymologies.map(e => e.id)), [[eB], [eA, eNote]]);
  assert.deepEqual(projected[0].etymologies[0], {
    id: eB, note: 'shared root', languageId: langB, languageTitle: 'Foreign Language',
    wordId: refB, wordTitle: 'Foreign Reference',
  });
  assert.equal(projected[1].etymologies[0].wordTitle, 'Native Reference');
  assert.deepEqual(projected[1].etymologies[1], {
    id: eNote, note: 'independent reconstructed origin',
  });

  // Author edits to source and referenced word are NOT reflected in public projections.
  db = editNode(db, refB, 1, contents('PRIVATE Foreign Name'), now + 4);
  db = editNode(db, source, 2,
    contents('PRIVATE Source Name', { meanings: JSON.stringify([
      { ...meanings[0], definition: 'PRIVATE meaning draft' }, meanings[1],
    ]) }), now + 4);
  projected = meaningList(db, source, now + 5);
  assert.equal(toReader(db, source, now + 5).content.title, 'Source Word');
  assert.equal(projected[0].definition, 'first independent meaning');
  assert.equal(projected[0].etymologies[0].wordTitle, 'Foreign Reference');
  assert.ok(!JSON.stringify(toReader(db, source, now + 5)).includes('PRIVATE'));

  // Publishing only the reference makes its published label newly visible.
  db = publishNode(db, refB, 2, now + 6);
  projected = meaningList(db, source, now + 7);
  assert.equal(projected[0].etymologies[0].wordTitle, 'PRIVATE Foreign Name');
  assert.equal(projected[0].definition, 'first independent meaning',
    'reference publication cannot update unpublished source meaning');

  // Hiding the referenced word alone keeps the public language but not the private word.
  db = setVisibility(db, refB, 2, false, null, now + 7);
  assert.deepEqual(meaningList(db, source, now + 7)[0].etymologies[0], {
    id: eB, note: 'shared root', languageId: langB, languageTitle: 'Foreign Language',
  });
  db = setVisibility(db, refB, 3, true, null, now + 7);
  assert.equal(meaningList(db, source, now + 7)[0].etymologies[0].wordId, refB);

  // Hiding its ancestor must strip IDs and titles, not the source's own public note.
  db = setVisibility(db, langB, 1, false, null, now + 8);
  assert.equal(toReader(db, refB, now + 9), null);
  projected = meaningList(db, source, now + 9);
  assert.deepEqual(projected[0].etymologies[0], {
    id: eB, note: 'shared root',
  });
  assert.equal(projected[1].etymologies[0].wordTitle, 'Native Reference');
  assert.deepEqual(projected[1].etymologies[1], {
    id: eNote, note: 'independent reconstructed origin',
  });
  assert.ok(!JSON.stringify(projected).includes(refB));
  assert.ok(!JSON.stringify(projected).includes(langB));
  assert.ok(!JSON.stringify(projected).includes('Foreign Language'));
  assert.ok(!JSON.stringify(projected).includes('PRIVATE Foreign Name'));

  // Restoring and re-scheduling the reference language affects only that origin.
  db = setVisibility(db, langB, 2, true, null, now + 10);
  assert.equal(meaningList(db, source, now + 11)[0].etymologies[0].wordId, refB);
  const future = now + 60_000;
  db = setVisibility(db, langB, 3, true, future, now + 12);
  assert.equal(meaningList(db, source, future - 1)[0].etymologies[0].wordId, undefined);
  assert.equal(meaningList(db, source, future)[0].etymologies[0].wordId, refB);
  assert.equal(meaningList(db, source, future)[1].etymologies[0].wordId, refA);
});
