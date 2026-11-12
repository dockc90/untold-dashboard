// Export packaging utilities ported cleanly from ssamtool/sinsoo render.js
// Zero external CDN dependencies: pure TypeScript UTF-8 CRC32 store ZIP builder + SRT + CSV generators.

export interface SubtitleCue {
  s: number;
  e: number;
  t: string;
}

export const stripRichFormatting = (text: string): string => String(text || '').replace(/\*\*/g, '');

const pad2 = (n: number, len = 2) => String(Math.floor(Math.max(0, n))).padStart(len, '0');

export function fmtTimecode(sec: number, showTenths = false): string {
  const s = Math.max(0, +sec || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const base = `${h ? `${h}:${pad2(m)}` : m}:${pad2(ss)}`;
  return showTenths ? `${base}.${pad2(Math.round((s % 1) * 10), 1)}` : base;
}

export function fmtSrtTimestamp(sec: number): string {
  const s = Math.max(0, +sec || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(ss)},${pad2(ms, 3)}`;
}

export function parseTimecode(str: string | number): number {
  if (typeof str === 'number') return str;
  const s = String(str || '').trim();
  if (!s) return NaN;
  if (/^\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);
  const parts = s.split(':').map((x) => parseFloat(x));
  if (parts.some((n) => Number.isNaN(n))) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

export function chunkSubtitles(text: string, duration: number, maxLen = 24): SubtitleCue[] {
  const cleaned = stripRichFormatting(text).replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const sents = cleaned.split(/(?<=[.!?。]|다\.|요\.|죠\.|까\?)\s+/).filter(Boolean);
  const chunks: string[] = [];
  sents.forEach((s) => {
    if (s.length <= maxLen) {
      chunks.push(s);
      return;
    }
    const words = s.split(' ');
    let cur = '';
    words.forEach((w) => {
      if ((`${cur} ${w}`).trim().length > maxLen && cur) {
        chunks.push(cur.trim());
        cur = w;
      } else {
        cur = (`${cur} ${w}`).trim();
      }
    });
    if (cur) chunks.push(cur);
  });
  const dur = Math.max(0.5, duration);
  const totalLen = chunks.reduce((a, c) => a + c.length + 1, 0) || 1;
  let acc = 0;
  return chunks.map((c) => {
    const d = (dur * (c.length + 1)) / totalLen;
    const cue = { s: acc, e: Math.min(dur, acc + d), t: c };
    acc += d;
    return cue;
  });
}

export function generateSrt(cues: SubtitleCue[], offset = 0): string {
  return (cues || [])
    .filter((x) => x.t && x.t.trim())
    .map((x, i) => `${i + 1}\n${fmtSrtTimestamp(x.s - offset)} --> ${fmtSrtTimestamp(x.e - offset)}\n${stripRichFormatting(x.t)}\n`)
    .join('\n');
}

export function generateCsv(rows: (string | number | undefined)[][]): string {
  return (
    '\uFEFF' +
    rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell == null ? '' : cell);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      )
      .join('\n')
  );
}

export function safeFileName(s: string, maxLen = 50): string {
  return (
    String(s || '제목없음')
      .replace(/[\\/:*?"<>|\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLen) || '제목없음'
  );
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 4000);
}

export function fmtBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(2)}GB`;
}

/* ───────── Zero-dependency Pure TS ZIP Builder (STORE mode with CRC32 & UTF-8) ───────── */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntryInput {
  name: string;
  text?: string;
  blob?: Blob;
  bytes?: Uint8Array;
}

export async function createZipBlob(entries: ZipEntryInput[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
  const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

  for (const entry of entries) {
    if (!entry.name) continue;
    let data: Uint8Array;
    if (entry.bytes) data = entry.bytes;
    else if (entry.blob) data = new Uint8Array(await entry.blob.arrayBuffer());
    else if (entry.text != null) data = encoder.encode(entry.text);
    else continue;

    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(data);
    const size = data.length;

    // Local file header (30 bytes + filename)
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // compression: 0 (store)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    lh.set(nameBytes, 30);

    // Central directory header (46 bytes + filename)
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    ch.set(nameBytes, 46);

    localParts.push(lh, data);
    centralParts.push(ch);
    offset += lh.length + data.length;
  }

  const centralSize = centralParts.reduce((a, p) => a + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, centralParts.length, true);
  ev.setUint16(10, centralParts.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [
    ...localParts.map((u) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer),
    ...centralParts.map((u) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer),
    eocd.buffer as ArrayBuffer,
  ];
  return new Blob(blobParts, { type: 'application/zip' });
}
