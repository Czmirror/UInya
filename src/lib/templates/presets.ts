// Defines complete editable layouts and the coordinates shared with their shelf previews.

export const PRESET_TEXT_COLOR = '#512d20';

interface PresetPosition {
  /** Left position for SVGs, center position for text, as a fraction of the canvas width. */
  xRatio: number;
  /** Top position for SVGs, center position for text, as a fraction of the canvas height. */
  yRatio: number;
  /** Width of an SVG or font size of a label, as a fraction of the canvas width. */
  scaleRatio: number;
  idPrefix: string;
}

export type PresetElement = PresetPosition & (
  | { svgFile: string; aspectHeight: number }
  | { text: string }
);

export interface UIPreset {
  id: string;
  elements: PresetElement[];
}

export const uiPresets: UIPreset[] = [
  {
    id: 'rpg-hp-bar',
    elements: [
      { svgFile: '/templates/collections/honey/gauge.svg', aspectHeight: 94 / 265, xRatio: 0.08, yRatio: 0.32, scaleRatio: 0.84, idPrefix: 'preset-gauge' },
      { text: '70 / 100', xRatio: 0.68, yRatio: 0.515, scaleRatio: 0.035, idPrefix: 'preset-text' },
    ],
  },
  {
    id: 'dialog-window',
    elements: [
      { svgFile: '/templates/collections/honey/frame.svg', aspectHeight: 176 / 256, xRatio: 0.1, yRatio: 0.2, scaleRatio: 0.8, idPrefix: 'preset-frame' },
      { text: 'こんにちは！', xRatio: 0.5, yRatio: 0.51, scaleRatio: 0.045, idPrefix: 'preset-text' },
    ],
  },
  {
    id: 'skill-button',
    elements: [
      { svgFile: '/templates/collections/peach/button.svg', aspectHeight: 194 / 256, xRatio: 0.14, yRatio: 0.2, scaleRatio: 0.72, idPrefix: 'preset-button' },
      { text: 'スキル', xRatio: 0.5, yRatio: 0.584, scaleRatio: 0.043, idPrefix: 'preset-text' },
    ],
  },
  {
    id: 'icon-frame',
    elements: [
      { svgFile: '/templates/collections/strawberry/avatar.svg', aspectHeight: 204 / 256, xRatio: 0.1, yRatio: 0.18, scaleRatio: 0.8, idPrefix: 'preset-iconframe' },
    ],
  },
];
