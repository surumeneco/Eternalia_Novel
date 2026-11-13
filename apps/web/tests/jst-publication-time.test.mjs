import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJstLocalDateTime, formatJstLocalDateTime, formatJstDisplay } from '../app/utils/jst-publication-time.ts';

test('PB-05: datetime-local is ALWAYS JST (+09) even if browser/Node TZ is different',()=>{
 const original = process.env.TZ;
 try {
  const fixed = Date.parse('2031-02-03T00:15:00.000Z');
  for(const tz of ['UTC','America/Los_Angeles','Asia/Tokyo','Europe/London']){
   process.env.TZ = tz;
   assert.equal(parseJstLocalDateTime('2031-02-03T09:15'),fixed,tz);
   assert.equal(formatJstLocalDateTime(fixed),'2031-02-03T09:15',tz);
  }
 } finally { if(original===undefined) delete process.env.TZ; else process.env.TZ=original; }
});
test('PB-05: round trip supports day/year boundaries and correct leap days',()=>{
 const inputs=['2026-01-01T00:00','2032-02-29T23:59','2100-03-01T00:00',
               '2031-02-03T09:15:23','2026-11-13T23:59'];
 for(const input of inputs){
  const utc=parseJstLocalDateTime(input);
  assert.equal(typeof utc,'number',input);
  assert.equal(formatJstLocalDateTime(utc),input,input);
 }
 assert.equal(parseJstLocalDateTime('1970-01-01T09:00'),0,'Epoch zero is valid');
});
test('PB-05: rejects normalized-invalid and unsafe date-time values before API write',()=>{
 const invalid=['','2031-02-30T09:15','2031-13-01T09:15','2031-00-01T09:15',
   '2031-01-00T09:15','2031-01-01T24:00','2031-01-01T09:60','2031-01-01T09:01:60',
   '2031-1-01T09:01','2031-01-01 09:01','2031-01-01T09:01Z',
   '1969-12-31T23:59','2031-01-01T09:01.000','2031-02-29T09:15','not-a-time'];
 for(const input of invalid) assert.equal(parseJstLocalDateTime(input),null,input);
 assert.equal(formatJstLocalDateTime(NaN),null);
 assert.equal(formatJstLocalDateTime(-1),null);
});
test('PB-05: published date display is JST independent of browser timezone',()=>{
 const ms=Date.parse('2031-02-03T00:15:00Z');
 const original=process.env.TZ;
 try{
   for(const tz of ['UTC','America/Los_Angeles','Asia/Tokyo']){
    process.env.TZ=tz;
    const ja=formatJstDisplay(ms,'ja');
    const en=formatJstDisplay(ms,'en');
    assert.ok(ja?.includes('2031'),tz);
    assert.ok(en?.includes('2031'),tz);
    assert.match(ja,/9:15|09:15/);
    assert.match(en,/9:15|09:15/);
    assert.equal(en,formatJstDisplay(ms,'en'));
   }
 }finally{if(original===undefined)delete process.env.TZ;else process.env.TZ=original}
});
