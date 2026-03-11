/**
 * Random Cat UI generation definitions.
 *
 * Provides colour themes and layout patterns that combine existing
 * parts, templates and accents into a single "random cat UI" composition.
 */

// ── Colour themes (safe, visually appealing combos) ──

export interface ColorTheme {
  id: string;
  fill: string;
  stroke: string;
  accent: string;
  bg: string;
}

export const colorThemes: ColorTheme[] = [
  { id: 'candy-pink',   fill: '#FFB7C5', stroke: '#E91E8C', accent: '#FF6BB5', bg: '#1A1A2E' },
  { id: 'ocean-blue',   fill: '#7EC8E3', stroke: '#3B82F6', accent: '#60A5FA', bg: '#0F1729' },
  { id: 'mint-cat',     fill: '#A7F3D0', stroke: '#34D399', accent: '#6EE7B7', bg: '#0F2922' },
  { id: 'night-purple', fill: '#C4B5FD', stroke: '#8B5CF6', accent: '#A78BFA', bg: '#1E1B3A' },
  { id: 'cream-brown',  fill: '#FDE68A', stroke: '#D97706', accent: '#FBBF24', bg: '#1C1510' },
  { id: 'sunset-coral', fill: '#FDA4AF', stroke: '#F43F5E', accent: '#FB7185', bg: '#1A1020' },
];

// ── Part pools (SVG file paths matching static/parts/*) ──

export const faceParts  = ['/parts/face/face-round-basic.svg', '/parts/face/face-round-soft.svg'];
export const earParts   = ['/parts/ears/ear-point-left.svg', '/parts/ears/ear-round-left.svg'];
export const earPartsR  = ['/parts/ears/ear-point-right.svg', '/parts/ears/ear-round-right.svg'];
export const eyeParts   = ['/parts/eyes/eye-dot.svg', '/parts/eyes/eye-happy.svg', '/parts/eyes/eye-angry.svg', '/parts/eyes/eye-sleep.svg'];
export const noseParts  = ['/parts/nose/nose-triangle.svg', '/parts/nose/nose-heart.svg'];
export const mouthParts = ['/parts/mouth/mouth-cat.svg', '/parts/mouth/mouth-smile.svg', '/parts/mouth/mouth-flat.svg'];
export const whiskerParts = ['/parts/whiskers/whisker-pair.svg'];
export const expressionParts = [
  '/parts/expressions/expression-happy.svg',
  '/parts/expressions/expression-sleepy.svg',
  '/parts/expressions/expression-surprised.svg',
  '/parts/expressions/expression-smug.svg',
];
export const accentParts = [
  '/parts/accents/accent-star.svg',
  '/parts/accents/accent-heart.svg',
  '/parts/accents/accent-sparkle.svg',
  '/parts/accents/accent-moon.svg',
  '/parts/accents/accent-cloud.svg',
];

export const templateParts = [
  '/templates/paw-button.svg',
  '/templates/tail-gauge.svg',
  '/templates/cat-ear-frame.svg',
  '/templates/cat-icon-frame.svg',
];

// ── Layout patterns ──

export type PatternId = 'cat-face' | 'ui-combo' | 'dialog-scene';

export interface PlacedPart {
  svgFile: string;
  /** Position ratios relative to canvas width/height (0‒1) */
  x: number;
  y: number;
  /** Scale relative to canvas width */
  scale: number;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Pattern A: Cat face + 2‒3 accents
 * Face centred, ears above, eyes/nose/mouth overlaid, accents scattered around.
 */
function generateCatFacePattern(): PlacedPart[] {
  const earIdx = Math.floor(Math.random() * earParts.length);
  const useExpression = Math.random() > 0.5;

  const parts: PlacedPart[] = [
    // Face base (centre)
    { svgFile: pick(faceParts), x: 0.30, y: 0.25, scale: 0.40 },
    // Left ear
    { svgFile: earParts[earIdx], x: 0.22, y: 0.10, scale: 0.18 },
    // Right ear
    { svgFile: earPartsR[earIdx], x: 0.52, y: 0.10, scale: 0.18 },
  ];

  if (useExpression) {
    // Use a complete expression instead of individual parts
    parts.push({ svgFile: pick(expressionParts), x: 0.30, y: 0.30, scale: 0.30 });
  } else {
    // Individual eye, nose, mouth
    parts.push({ svgFile: pick(eyeParts), x: 0.34, y: 0.32, scale: 0.12 });
    parts.push({ svgFile: pick(noseParts), x: 0.40, y: 0.42, scale: 0.08 });
    parts.push({ svgFile: pick(mouthParts), x: 0.38, y: 0.48, scale: 0.12 });
  }

  // Whiskers
  parts.push({ svgFile: pick(whiskerParts), x: 0.26, y: 0.40, scale: 0.35 });

  // 2‒3 accents scattered around the face
  const accents = pickN(accentParts, 2 + Math.floor(Math.random() * 2));
  const accentPositions = [
    { x: 0.05, y: 0.05, scale: 0.12 },
    { x: 0.75, y: 0.08, scale: 0.10 },
    { x: 0.78, y: 0.55, scale: 0.14 },
  ];
  accents.forEach((svg, i) => {
    const pos = accentPositions[i % accentPositions.length];
    parts.push({ svgFile: svg, ...pos });
  });

  return parts;
}

/**
 * Pattern B: UI element + cat parts + accents
 */
function generateUIComboPattern(): PlacedPart[] {
  const parts: PlacedPart[] = [
    // Main UI element (centre-lower)
    { svgFile: pick(templateParts), x: 0.15, y: 0.35, scale: 0.55 },
    // Cat face decoration (upper-left)
    { svgFile: pick(faceParts), x: 0.05, y: 0.05, scale: 0.22 },
  ];

  // Ear on the face decoration
  const earIdx = Math.floor(Math.random() * earParts.length);
  parts.push({ svgFile: earParts[earIdx], x: 0.02, y: -0.02, scale: 0.10 });
  parts.push({ svgFile: earPartsR[earIdx], x: 0.18, y: -0.02, scale: 0.10 });

  // Expression on face
  parts.push({ svgFile: pick(expressionParts), x: 0.05, y: 0.08, scale: 0.16 });

  // 2 accents
  const accents = pickN(accentParts, 2);
  parts.push({ svgFile: accents[0], x: 0.72, y: 0.05, scale: 0.12 });
  if (accents[1]) parts.push({ svgFile: accents[1], x: 0.78, y: 0.70, scale: 0.10 });

  return parts;
}

/**
 * Pattern C: Dialog scene — frame + cat face + accent
 */
function generateDialogScenePattern(): PlacedPart[] {
  const parts: PlacedPart[] = [
    // Dialog frame (centre)
    { svgFile: '/templates/cat-ear-frame.svg', x: 0.10, y: 0.20, scale: 0.65 },
    // Cat icon in corner
    { svgFile: '/templates/cat-icon-frame.svg', x: 0.02, y: 0.55, scale: 0.25 },
    // Expression inside icon area
    { svgFile: pick(expressionParts), x: 0.05, y: 0.60, scale: 0.15 },
  ];

  // Accents
  const accents = pickN(accentParts, 2);
  parts.push({ svgFile: accents[0], x: 0.75, y: 0.15, scale: 0.11 });
  if (accents[1]) parts.push({ svgFile: accents[1], x: 0.70, y: 0.75, scale: 0.13 });

  return parts;
}

/**
 * Generate a random cat UI composition.
 * Returns a colour theme and a list of parts to place.
 */
export function generateRandomLayout(): { theme: ColorTheme; parts: PlacedPart[] } {
  const theme = pick(colorThemes);
  const patterns = [generateCatFacePattern, generateUIComboPattern, generateDialogScenePattern];
  const parts = pick(patterns)();
  return { theme, parts };
}
