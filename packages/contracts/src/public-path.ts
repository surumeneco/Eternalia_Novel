/**
 * Public ancestry for breadcrumbs and chapter navigation. Every segment must
 * pass the same gate as the direct published item endpoint.
 */
import { type Library, type ReaderNode, ancestorsOf, toReader } from './novel.js';
export function publicPath(library:Library,id:string,now:number):ReaderNode[] {
  let chain;
  try {chain=ancestorsOf(library,id);}catch{return [];}
  const result:ReaderNode[]=[];
  for(const node of chain) {
    const publicNode=toReader(library,node.id,now);
    if(!publicNode) return [];
    result.push(publicNode);
  }
  return result;
}
