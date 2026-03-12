/**
 * Themed Random Cat UI generation.
 *
 * Each "theme" bundles a colour palette, preferred parts/accents, and
 * weighted layout patterns so the output looks coherent rather than
 * purely random.
 */

// ── Helpers ──

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ── Colour palette ──

export interface ColorTheme {
  id: string;
  fill: string;
  stroke: string;
  accent: string;
  bg: string;
}

// ── Placed part ──

export interface PlacedPart {
  svgFile: string;
  x: number;
  y: number;
  scale: number;
}

// ── Asset pools ──

const faceParts   = ['/parts/face/face-round-basic.svg', '/parts/face/face-round-soft.svg'] as const;
const earPartsL   = ['/parts/ears/ear-point-left.svg', '/parts/ears/ear-round-left.svg'] as const;
const earPartsR   = ['/parts/ears/ear-point-right.svg', '/parts/ears/ear-round-right.svg'] as const;
const eyeParts    = ['/parts/eyes/eye-dot.svg', '/parts/eyes/eye-happy.svg', '/parts/eyes/eye-angry.svg', '/parts/eyes/eye-sleep.svg'] as const;
const noseParts   = ['/parts/nose/nose-triangle.svg', '/parts/nose/nose-heart.svg'] as const;
const mouthParts  = ['/parts/mouth/mouth-cat.svg', '/parts/mouth/mouth-smile.svg', '/parts/mouth/mouth-flat.svg'] as const;
const whiskerParts = ['/parts/whiskers/whisker-pair.svg'] as const;

const expressionsCute  = ['/parts/expressions/expression-happy.svg', '/parts/expressions/expression-sleepy.svg', '/parts/expressions/expression-smug.svg'] as const;
const expressionsDark  = ['/parts/expressions/expression-angry.svg', '/parts/expressions/expression-smug.svg', '/parts/expressions/expression-surprised.svg'] as const;
const expressionsAll   = ['/parts/expressions/expression-happy.svg', '/parts/expressions/expression-sleepy.svg', '/parts/expressions/expression-surprised.svg', '/parts/expressions/expression-angry.svg', '/parts/expressions/expression-smug.svg'] as const;

const accentsCute  = ['/parts/accents/accent-heart.svg', '/parts/accents/accent-star.svg', '/parts/accents/accent-sparkle.svg'] as const;
const accentsDark  = ['/parts/accents/accent-moon.svg', '/parts/accents/accent-star.svg', '/parts/accents/accent-sparkle.svg'] as const;
const accentsSoft  = ['/parts/accents/accent-cloud.svg', '/parts/accents/accent-heart.svg', '/parts/accents/accent-sparkle.svg'] as const;
const accentsAll   = ['/parts/accents/accent-star.svg', '/parts/accents/accent-heart.svg', '/parts/accents/accent-sparkle.svg', '/parts/accents/accent-moon.svg', '/parts/accents/accent-cloud.svg'] as const;

const templateButtons = ['/templates/paw-button.svg'] as const;
const templateFrames  = ['/templates/cat-ear-frame.svg', '/templates/cat-icon-frame.svg'] as const;
const templateGauges  = ['/templates/tail-gauge.svg'] as const;
const templateAll     = ['/templates/paw-button.svg', '/templates/tail-gauge.svg', '/templates/cat-ear-frame.svg', '/templates/cat-icon-frame.svg'] as const;

// ── Theme definitions ──

export interface RandomTheme {
  id: string;
  labelJa: string;
  labelEn: string;
  colors: readonly ColorTheme[];
  expressions: readonly string[];
  accents: readonly string[];
  templates: readonly string[];
  /** Weighted pattern generators — theme picks from these */
  patterns: (() => PlacedPart[])[];
}

// Pattern generators (reusable across themes)

function catFacePattern(exprPool: readonly string[], accentPool: readonly string[]): PlacedPart[] {
  const earIdx = Math.floor(Math.random() * earPartsL.length);
  const useExpression = Math.random() > 0.4;

  const parts: PlacedPart[] = [
    { svgFile: pick(faceParts), x: 0.30, y: 0.25, scale: 0.40 },
    { svgFile: earPartsL[earIdx], x: 0.22, y: 0.10, scale: 0.18 },
    { svgFile: earPartsR[earIdx], x: 0.52, y: 0.10, scale: 0.18 },
  ];

  if (useExpression) {
    parts.push({ svgFile: pick(exprPool), x: 0.30, y: 0.30, scale: 0.30 });
  } else {
    parts.push({ svgFile: pick(eyeParts), x: 0.34, y: 0.32, scale: 0.12 });
    parts.push({ svgFile: pick(noseParts), x: 0.40, y: 0.42, scale: 0.08 });
    parts.push({ svgFile: pick(mouthParts), x: 0.38, y: 0.48, scale: 0.12 });
  }

  parts.push({ svgFile: pick(whiskerParts), x: 0.26, y: 0.40, scale: 0.35 });

  const accents = pickN(accentPool, 2 + Math.floor(Math.random() * 2));
  const positions = [
    { x: 0.05, y: 0.05, scale: 0.12 },
    { x: 0.75, y: 0.08, scale: 0.10 },
    { x: 0.78, y: 0.55, scale: 0.14 },
  ];
  accents.forEach((svg, i) => parts.push({ svgFile: svg, ...positions[i % positions.length] }));

  return parts;
}

function uiComboPattern(tplPool: readonly string[], exprPool: readonly string[], accentPool: readonly string[]): PlacedPart[] {
  const earIdx = Math.floor(Math.random() * earPartsL.length);
  const parts: PlacedPart[] = [
    { svgFile: pick(tplPool), x: 0.15, y: 0.35, scale: 0.55 },
    { svgFile: pick(faceParts), x: 0.05, y: 0.05, scale: 0.22 },
    { svgFile: earPartsL[earIdx], x: 0.02, y: -0.02, scale: 0.10 },
    { svgFile: earPartsR[earIdx], x: 0.18, y: -0.02, scale: 0.10 },
    { svgFile: pick(exprPool), x: 0.05, y: 0.08, scale: 0.16 },
  ];

  const accents = pickN(accentPool, 2);
  parts.push({ svgFile: accents[0], x: 0.72, y: 0.05, scale: 0.12 });
  if (accents[1]) parts.push({ svgFile: accents[1], x: 0.78, y: 0.70, scale: 0.10 });

  return parts;
}

function dialogPattern(exprPool: readonly string[], accentPool: readonly string[]): PlacedPart[] {
  const parts: PlacedPart[] = [
    { svgFile: '/templates/cat-ear-frame.svg', x: 0.10, y: 0.20, scale: 0.65 },
    { svgFile: '/templates/cat-icon-frame.svg', x: 0.02, y: 0.55, scale: 0.25 },
    { svgFile: pick(exprPool), x: 0.05, y: 0.60, scale: 0.15 },
  ];

  const accents = pickN(accentPool, 2);
  parts.push({ svgFile: accents[0], x: 0.75, y: 0.15, scale: 0.11 });
  if (accents[1]) parts.push({ svgFile: accents[1], x: 0.70, y: 0.75, scale: 0.13 });

  return parts;
}

// ── Theme catalogue ──

export const randomThemes: RandomTheme[] = [
  {
    id: 'cute',
    labelJa: 'Cute UI',
    labelEn: 'Cute UI',
    colors: [
      { id: 'candy-pink',   fill: '#FFB7C5', stroke: '#E91E8C', accent: '#FF6BB5', bg: '#1A1A2E' },
      { id: 'sakura',       fill: '#FBCFE8', stroke: '#EC4899', accent: '#F9A8D4', bg: '#1E1028' },
    ],
    expressions: expressionsCute,
    accents: accentsCute,
    templates: templateButtons,
    patterns: [
      () => catFacePattern(expressionsCute, accentsCute),
      () => uiComboPattern(templateButtons, expressionsCute, accentsCute),
    ],
  },
  {
    id: 'dark',
    labelJa: 'Dark UI',
    labelEn: 'Dark UI',
    colors: [
      { id: 'night-purple', fill: '#C4B5FD', stroke: '#8B5CF6', accent: '#A78BFA', bg: '#1E1B3A' },
      { id: 'dark-teal',    fill: '#5EEAD4', stroke: '#14B8A6', accent: '#2DD4BF', bg: '#0A1A1A' },
    ],
    expressions: expressionsDark,
    accents: accentsDark,
    templates: [...templateFrames, ...templateGauges],
    patterns: [
      () => catFacePattern(expressionsDark, accentsDark),
      () => dialogPattern(expressionsDark, accentsDark),
      () => uiComboPattern([...templateFrames, ...templateGauges], expressionsDark, accentsDark),
    ],
  },
  {
    id: 'candy',
    labelJa: 'Candy UI',
    labelEn: 'Candy UI',
    colors: [
      { id: 'candy-pop',    fill: '#FCA5A5', stroke: '#F87171', accent: '#FBBF24', bg: '#1C1024' },
      { id: 'bubblegum',    fill: '#F9A8D4', stroke: '#F472B6', accent: '#C084FC', bg: '#1A1028' },
    ],
    expressions: expressionsCute,
    accents: ['/parts/accents/accent-heart.svg', '/parts/accents/accent-star.svg', '/parts/accents/accent-sparkle.svg', '/parts/accents/accent-cloud.svg'],
    templates: templateButtons,
    patterns: [
      () => catFacePattern(expressionsCute, ['/parts/accents/accent-heart.svg', '/parts/accents/accent-star.svg', '/parts/accents/accent-sparkle.svg']),
      () => uiComboPattern(templateButtons, expressionsCute, ['/parts/accents/accent-heart.svg', '/parts/accents/accent-star.svg']),
    ],
  },
  {
    id: 'retro',
    labelJa: 'Retro UI',
    labelEn: 'Retro UI',
    colors: [
      { id: 'cream-brown',  fill: '#FDE68A', stroke: '#D97706', accent: '#FBBF24', bg: '#1C1510' },
      { id: 'retro-orange', fill: '#FDBA74', stroke: '#EA580C', accent: '#FB923C', bg: '#1A1408' },
    ],
    expressions: expressionsAll,
    accents: ['/parts/accents/accent-star.svg', '/parts/accents/accent-moon.svg', '/parts/accents/accent-sparkle.svg'],
    templates: templateAll,
    patterns: [
      () => uiComboPattern(templateAll, expressionsAll, ['/parts/accents/accent-star.svg', '/parts/accents/accent-moon.svg']),
      () => dialogPattern(expressionsAll, ['/parts/accents/accent-star.svg', '/parts/accents/accent-moon.svg']),
    ],
  },
  {
    id: 'soft',
    labelJa: 'Soft UI',
    labelEn: 'Soft UI',
    colors: [
      { id: 'mint-cat',     fill: '#A7F3D0', stroke: '#34D399', accent: '#6EE7B7', bg: '#0F2922' },
      { id: 'ocean-blue',   fill: '#7EC8E3', stroke: '#3B82F6', accent: '#60A5FA', bg: '#0F1729' },
      { id: 'lavender',     fill: '#DDD6FE', stroke: '#A78BFA', accent: '#C4B5FD', bg: '#1A1830' },
    ],
    expressions: [...expressionsCute, '/parts/expressions/expression-sleepy.svg'],
    accents: accentsSoft,
    templates: templateFrames,
    patterns: [
      () => catFacePattern([...expressionsCute, '/parts/expressions/expression-sleepy.svg'], accentsSoft),
      () => dialogPattern([...expressionsCute, '/parts/expressions/expression-sleepy.svg'], accentsSoft),
    ],
  },
];

// ── Public API ──

export interface RandomResult {
  themeId: string;
  theme: ColorTheme;
  parts: PlacedPart[];
}

/**
 * Generate a themed random cat UI.
 * If themeId is provided, use that specific theme; otherwise pick randomly.
 */
export function generateRandomLayout(themeId?: string): RandomResult {
  const themeDef = themeId
    ? randomThemes.find(t => t.id === themeId) ?? pick(randomThemes)
    : pick(randomThemes);

  const color = pick(themeDef.colors);
  const pattern = pick(themeDef.patterns);
  const parts = pattern();

  return { themeId: themeDef.id, theme: color, parts };
}
