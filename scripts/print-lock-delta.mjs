/** CI-only metadata evidence to reconcile new workspace deps into committed lockfile. */
import { readFileSync } from 'node:fs';
const oldLock = JSON.parse(readFileSync('/tmp/eternalia-original-lock.json', 'utf8'));
const nextLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const updates = Object.fromEntries(Object.entries(nextLock.packages)
  .filter(([name, value]) => JSON.stringify(oldLock.packages[name]) !== JSON.stringify(value)));
const removed = Object.keys(oldLock.packages).filter(name => !(name in nextLock.packages));
console.log('LOCK_DELTA_JSON=' + JSON.stringify({ updates, removed }));
