export function canonicalCreateAdmission(author:boolean,scope:'root'|'child',parent:'none'|'same'|'invalid',kindMatches:boolean):boolean {
  return author && kindMatches && (scope==='root' ? parent==='none' : parent==='same');
}
