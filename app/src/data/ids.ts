/** 이름 → 안정적 ID. 순서 변경에 영향받지 않도록 이름 해시 기반(djb2 → base36). */
export function slugId(prefix: string, name: string): string {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) >>> 0;
  return `${prefix}_${h.toString(36)}`;
}
