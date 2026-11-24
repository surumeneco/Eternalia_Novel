import type { ReaderKind } from '../types/reader';

const groups: Record<Exclude<ReaderKind,'series'>,string> = {
  volume:'stories/volumes',part:'stories/parts',chapter:'stories/chapters',
  category:'settings/categories',tip:'settings/tips',tipSection:'settings/sections',
  language:'dictionaries/languages',word:'dictionaries/words',grammar:'dictionaries/grammar',
  periodization:'timeline/periods',event:'timeline/events',
};
export function adminGridPath(seriesId: string|null, kind:ReaderKind):string {
  if(kind==='series')return '/admin/series';
  if(!seriesId)throw new Error('series required');
  return '/admin/series/'+encodeURIComponent(seriesId)+'/'+groups[kind];
}
export function adminEditPath(seriesId:string,kind:ReaderKind,id:string):string {
  if(kind==='series')return '/admin/series/'+encodeURIComponent(id)+'/edit';
  return adminGridPath(seriesId,kind)+'/'+encodeURIComponent(id)+'/edit';
}
export function adminCreatePath(seriesId:string|null,kind:ReaderKind,parentId:string|null):string {
  if(kind==='series')return '/admin/series/create';
  if(!seriesId||!parentId)throw new Error('parent and series required');
  return '/admin/series/'+encodeURIComponent(seriesId)+'/create/'+encodeURIComponent(kind)+'/'+encodeURIComponent(parentId);
}
