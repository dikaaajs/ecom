export const MAX_SITE_IMAGE_BYTES = 2 * 1024 * 1024;
export function siteImageType(bytes: Uint8Array): { extension: string; mime: string } | null {
  if (bytes.length < 12 || bytes.length > MAX_SITE_IMAGE_BYTES) return null;
  if ([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)) return { extension:"png", mime:"image/png" };
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return {extension:"jpg",mime:"image/jpeg"};
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start,end));
  if(text(0,4)==="RIFF" && text(8,12)==="WEBP") return {extension:"webp",mime:"image/webp"};
  if(["GIF87a","GIF89a"].includes(text(0,6))) return {extension:"gif",mime:"image/gif"};
  if(bytes[0]===0 && bytes[1]===0 && bytes[2]===1 && bytes[3]===0) return {extension:"ico",mime:"image/x-icon"};
  return null;
}
