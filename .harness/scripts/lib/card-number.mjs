// Limited heuristic for payment card numbers (PAN). It returns only a count so
// callers never print a matched value.

// Published test numbers from payment providers; they are expected in tests and docs.
const testNumbers = new Set([
  '4242424242424242', '4000056655665556', '4111111111111111', '4012888888881881',
  '5555555555554444', '2223003122003222', '5200828282828210', '5105105105105100',
  '378282246310005', '371449635398431', '6011111111111117', '6011000990139424',
  '3056930009020004', '36227206271667', '3566002020360505', '6200000000000005',
]);

// Lines carrying this marker hold other provider test numbers on purpose (e.g. 3-D Secure scenarios).
export const testCardMarker = 'harness:test-card';

// Digits in groups separated by one space or hyphen, or a plain run of digits.
const candidate = /(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])/g;

function brandLength(digits) {
  const n = digits.length;
  const p2 = Number(digits.slice(0, 2));
  const p4 = Number(digits.slice(0, 4));
  if (digits[0] === '4') return [13, 16, 19].includes(n);
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return n === 16;
  if (p2 === 34 || p2 === 37) return n === 15;
  if (p4 === 6011 || p2 === 65 || (p4 >= 6440 && p4 <= 6499)) return n >= 16 && n <= 19;
  if (p4 >= 3528 && p4 <= 3589) return n >= 16 && n <= 19;
  if (p2 === 36 || p2 === 38 || (p4 >= 3000 && p4 <= 3059)) return n >= 14 && n <= 19;
  return false;
}

export function passesLuhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function countCardNumbers(text) {
  let count = 0;
  const kept = text.split('\n').filter((line) => !line.includes(testCardMarker)).join('\n');
  for (const match of kept.matchAll(candidate)) {
    const digits = match[0].replace(/[ -]/g, '');
    if (testNumbers.has(digits)) continue;
    if (brandLength(digits) && passesLuhn(digits)) count += 1;
  }
  return count;
}
