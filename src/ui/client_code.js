// Browser-only helpers: code parsing + QR rendering (Version 1-L, alphanumeric mode).
// No build step, no dependencies.

const WORD_LENGTH = 5;
const SUFFIX_CHARS = 8;
const CHECKSUM_CHARS = 1;
const EXPECTED_WITH_CHECKSUM = WORD_LENGTH * 2 + SUFFIX_CHARS + CHECKSUM_CHARS; // 19
const EXPECTED_WITHOUT_CHECKSUM = WORD_LENGTH * 2 + SUFFIX_CHARS; // 18

const WORDS = await fetch("/assets/wordlist.json", { cache: "no-store" }).then((r) => r.json());
const WORD_TO_BYTE = Object.create(null);
for (let i = 0; i < WORDS.length; i++) WORD_TO_BYTE[WORDS[i]] = i;

const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const B32_DECODE = Object.create(null);
for (let i = 0; i < B32.length; i++) B32_DECODE[B32[i]] = i;
B32_DECODE["O"] = B32_DECODE["0"];
B32_DECODE["I"] = B32_DECODE["1"];
B32_DECODE["L"] = B32_DECODE["1"];
B32_DECODE["U"] = B32_DECODE["V"];

export function formatCode(input) {
  const n = normalize(input);
  if (n.length !== EXPECTED_WITH_CHECKSUM && n.length !== EXPECTED_WITHOUT_CHECKSUM) return input;
  const w1 = n.slice(0, 5);
  const w2 = n.slice(5, 10);
  const rest = n.slice(10);
  return `${w1}-${w2}-${rest}`.toLowerCase();
}

export function decode(input) {
  const normalized = normalize(input);
  let checksumPresent = true;
  if (normalized.length === EXPECTED_WITHOUT_CHECKSUM) checksumPresent = false;
  else if (normalized.length !== EXPECTED_WITH_CHECKSUM) return { ok: false, reason: "invalid_format" };

  const w1 = normalized.slice(0, WORD_LENGTH);
  const w2 = normalized.slice(WORD_LENGTH, WORD_LENGTH * 2);
  const suffix = normalized.slice(WORD_LENGTH * 2, WORD_LENGTH * 2 + SUFFIX_CHARS);
  const check = checksumPresent ? normalized.slice(-1) : "";

  const b0 = WORD_TO_BYTE[w1];
  const b1 = WORD_TO_BYTE[w2];
  if (b0 === undefined || b1 === undefined) return { ok: false, reason: "unknown_words" };

  const suffixBytes = base32Decode(suffix);
  if (!suffixBytes || suffixBytes.length !== 5) return { ok: false, reason: "invalid_suffix" };

  const idBytes = new Uint8Array(7);
  idBytes[0] = b0;
  idBytes[1] = b1;
  idBytes.set(suffixBytes, 2);

  if (checksumPresent) {
    const v = B32_DECODE[(check || "").toUpperCase()];
    if (v === undefined) return { ok: false, reason: "invalid_format" };
    if (v !== checksum5(idBytes)) return { ok: false, reason: "checksum_mismatch" };
  }

  return { ok: true, checksumPresent, normalized };
}

function normalize(input) {
  return String(input).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function checksum5(bytes) {
  let hash = 0x811c9dc5;
  for (const b of bytes) {
    hash ^= b;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash ^= hash >>> 8;
  return hash & 31;
}

function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/[^0-9A-Z]/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const v = B32_DECODE[ch];
    if (v === undefined) return null;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// ----------------
// QR (Version 1-L)
// ----------------

const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const ALNUM_MAP = Object.create(null);
for (let i = 0; i < ALNUM.length; i++) ALNUM_MAP[ALNUM[i]] = i;

export function qrToSvg(text, scale = 6) {
  const upper = String(text).toUpperCase();
  const matrix = qrMatrixV1L(upper);
  const size = matrix.length;
  const quiet = 4;
  const dim = (size + quiet * 2) * scale;
  let path = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix[y][x]) continue;
      const rx = (x + quiet) * scale;
      const ry = (y + quiet) * scale;
      path += `M${rx} ${ry}h${scale}v${scale}h-${scale}Z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="white"/>
  <path d="${path}" fill="black"/>
</svg>`;
}

function qrMatrixV1L(text) {
  const data = qrAlnumDataCodewordsV1(text);
  const ec = rsEncode(data, 7);
  const codewords = new Uint8Array(26);
  codewords.set(data, 0);
  codewords.set(ec, data.length);

  const bits = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push(((cw >> i) & 1) === 1);

  const size = 21;
  const m = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  const isFunc = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  placeFinder(m, isFunc, 0, 0);
  placeFinder(m, isFunc, size - 7, 0);
  placeFinder(m, isFunc, 0, size - 7);
  placeTiming(m, isFunc);

  // Dark module at (x=8, y=4*version+9=13)
  m[13][8] = true;
  isFunc[13][8] = true;

  const coords1 = formatCoords1();
  const coords2 = formatCoords2();
  for (const [y, x] of coords1) isFunc[y][x] = true;
  for (const [y, x] of coords2) isFunc[y][x] = true;

  // Data placement (mask 0)
  let bitIndex = 0;
  let x = size - 1;
  let dirUp = true;
  while (x > 0) {
    if (x === 6) x--; // timing column
    for (let i = 0; i < size; i++) {
      const y = dirUp ? size - 1 - i : i;
      for (let dx = 0; dx < 2; dx++) {
        const xx = x - dx;
        if (isFunc[y][xx]) continue;
        const bit = bits[bitIndex++] || false;
        m[y][xx] = bit ^ mask0(xx, y);
      }
    }
    dirUp = !dirUp;
    x -= 2;
  }

  // Format info (L + mask 0)
  const fmt = formatBits(0b01000); // EC=L(01), mask=000
  placeFormat(m, fmt, coords1, coords2);

  // Fill nulls (defensive)
  for (let yy = 0; yy < size; yy++) for (let xx = 0; xx < size; xx++) if (m[yy][xx] === null) m[yy][xx] = false;
  return m;
}

function mask0(x, y) {
  return (x + y) % 2 === 0;
}

function placeFinder(m, isFunc, x, y) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= 21 || yy >= 21) continue;
      const on =
        (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) ||
        (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
        (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      m[yy][xx] = on;
      isFunc[yy][xx] = true;
    }
  }
}

function placeTiming(m, isFunc) {
  for (let i = 8; i <= 21 - 9; i++) {
    const on = i % 2 === 0;
    m[6][i] = on;
    m[i][6] = on;
    isFunc[6][i] = true;
    isFunc[i][6] = true;
  }
}

function formatCoords1() {
  return [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
}

function formatCoords2() {
  return [
    [20, 8],
    [19, 8],
    [18, 8],
    [17, 8],
    [16, 8],
    [15, 8],
    [14, 8],
    [13, 8],
    [8, 20],
    [8, 19],
    [8, 18],
    [8, 17],
    [8, 16],
    [8, 15],
    [8, 14],
  ];
}

function placeFormat(m, fmt15, coords1, coords2) {
  const bits = [];
  for (let i = 14; i >= 0; i--) bits.push(((fmt15 >> i) & 1) === 1);
  for (let i = 0; i < 15; i++) {
    const [y1, x1] = coords1[i];
    const [y2, x2] = coords2[i];
    m[y1][x1] = bits[i];
    m[y2][x2] = bits[i];
  }
}

function formatBits(fmt5) {
  // BCH(15,5) with generator 0x537, then XOR 0x5412
  let data = fmt5 << 10;
  const gen = 0x537;
  for (let i = 14; i >= 10; i--) {
    if (((data >> i) & 1) === 1) data ^= gen << (i - 10);
  }
  const bch = (fmt5 << 10) | (data & 0x3ff);
  return bch ^ 0x5412;
}

function qrAlnumDataCodewordsV1(text) {
  // Version 1-L: 19 data codewords.
  const chars = [...text];
  for (const ch of chars) if (ALNUM_MAP[ch] === undefined) throw new Error("unsupported QR char");

  const bits = [];
  pushBits(bits, 0b0010, 4); // alphanumeric mode
  pushBits(bits, chars.length, 9); // count (v1)

  for (let i = 0; i < chars.length; i += 2) {
    if (i + 1 < chars.length) {
      const v = ALNUM_MAP[chars[i]] * 45 + ALNUM_MAP[chars[i + 1]];
      pushBits(bits, v, 11);
    } else {
      pushBits(bits, ALNUM_MAP[chars[i]], 6);
    }
  }

  const maxBits = 19 * 8;
  if (bits.length > maxBits) throw new Error("QR text too long for v1-L");

  // Terminator
  const remaining = maxBits - bits.length;
  for (let i = 0; i < Math.min(4, remaining); i++) bits.push(false);

  while (bits.length % 8 !== 0) bits.push(false);

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | (bits[i + j] ? 1 : 0);
    bytes.push(b);
  }

  let pad = 0;
  while (bytes.length < 19) {
    bytes.push(pad % 2 === 0 ? 0xec : 0x11);
    pad++;
  }

  return new Uint8Array(bytes);
}

function pushBits(out, value, count) {
  for (let i = count - 1; i >= 0; i--) out.push(((value >> i) & 1) === 1);
}

// Reed-Solomon for QR (GF(256), primitive 0x11d)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(deg) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < deg; i++) poly = polyMul(poly, new Uint8Array([1, GF_EXP[i]]));
  return poly;
}

function polyMul(p, q) {
  const out = new Uint8Array(p.length + q.length - 1);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) out[i + j] ^= gfMul(p[i], q[j]);
  }
  return out;
}

function rsEncode(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data, 0);

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(gen[j], coef);
  }

  return msg.slice(data.length);
}

