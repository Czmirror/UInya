// Limited heuristic for credentials and payment card numbers in text. It returns only
// the kinds it found, so callers never print a matched value.
import { countCardNumbers } from './card-number.mjs';

const credentialPatterns = [
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
];

// Returns the kinds found in text: 'secret' for a credential pattern, 'card' for a payment card number.
export function secretKinds(text) {
  const kinds = [];
  if (credentialPatterns.some((pattern) => pattern.test(text))) kinds.push('secret');
  if (countCardNumbers(text)) kinds.push('card');
  return kinds;
}

export function describeKind(kind) {
  return kind === 'card' ? 'potential payment card number; value withheld' : 'potential secret; value withheld';
}
