/**
 * 用途別UIプリセット定義
 *
 * 各プリセットは既存テンプレート/パーツSVGを複数まとめて配置する。
 * 新しい描画システムは作らず、既存の loadSVGFromURL を再利用する。
 */

export interface PresetElement {
  /** SVGファイルパス（static/ 配下） */
  svgFile: string;
  /** キャンバス上の初期位置 X（キャンバス幅に対する比率 0-1） */
  xRatio: number;
  /** キャンバス上の初期位置 Y（キャンバス高に対する比率 0-1） */
  yRatio: number;
  /** キャンバス幅に対するスケール比率（0-1） */
  scaleRatio: number;
  /** 初期回転（度） */
  angle?: number;
  /** ID接頭辞 */
  idPrefix: string;
}

export interface UIPreset {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  elements: PresetElement[];
}

export const uiPresets: UIPreset[] = [
  {
    id: 'rpg-hp-bar',
    name: 'RPG HP Bar',
    nameJa: 'RPG HPバー',
    description: 'しっぽゲージ + 肉球装飾 + HPテキスト',
    elements: [
      {
        svgFile: '/templates/gauges/tail-gauge.svg',
        xRatio: 0.15,
        yRatio: 0.3,
        scaleRatio: 0.6,
        idPrefix: 'preset-gauge',
      },
      {
        svgFile: '/parts/paws/paw-simple.svg',
        xRatio: 0.02,
        yRatio: 0.25,
        scaleRatio: 0.18,
        idPrefix: 'preset-paw',
      },
      {
        // テキスト要素のマーカー — svgFile が空文字ならテキスト生成
        svgFile: '',
        xRatio: 0.35,
        yRatio: 0.55,
        scaleRatio: 0,
        idPrefix: 'preset-text:HP 128 / 200',
      },
    ],
  },
  {
    id: 'dialog-window',
    name: 'Dialog Window',
    nameJa: '会話ウィンドウ',
    description: '猫耳フレーム + ひげテキストボックス + にゃんこアイコン',
    elements: [
      {
        svgFile: '/templates/frames/cat-ear-frame.svg',
        xRatio: 0.05,
        yRatio: 0.1,
        scaleRatio: 0.7,
        idPrefix: 'preset-frame',
      },
      {
        svgFile: '/templates/icons/cat-icon-frame.svg',
        xRatio: 0.02,
        yRatio: 0.55,
        scaleRatio: 0.25,
        idPrefix: 'preset-icon',
      },
      {
        svgFile: '',
        xRatio: 0.32,
        yRatio: 0.65,
        scaleRatio: 0,
        idPrefix: 'preset-text:にゃんこ',
      },
    ],
  },
  {
    id: 'skill-button',
    name: 'Skill Button',
    nameJa: 'スキルボタン',
    description: '肉球ボタン + 猫顔装飾',
    elements: [
      {
        svgFile: '/templates/buttons/paw-button.svg',
        xRatio: 0.2,
        yRatio: 0.15,
        scaleRatio: 0.55,
        idPrefix: 'preset-button',
      },
      {
        svgFile: '/parts/face/face-round-basic.svg',
        xRatio: 0.6,
        yRatio: 0.55,
        scaleRatio: 0.25,
        idPrefix: 'preset-face',
      },
      {
        svgFile: '',
        xRatio: 0.25,
        yRatio: 0.72,
        scaleRatio: 0,
        idPrefix: 'preset-text:スキル',
      },
    ],
  },
  {
    id: 'icon-frame',
    name: 'Icon Frame',
    nameJa: 'アイコンフレーム',
    description: 'にゃんこアイコンフレーム + 耳装飾',
    elements: [
      {
        svgFile: '/templates/icons/cat-icon-frame.svg',
        xRatio: 0.15,
        yRatio: 0.1,
        scaleRatio: 0.65,
        idPrefix: 'preset-iconframe',
      },
      {
        svgFile: '/parts/ears/ear-point-left.svg',
        xRatio: 0.12,
        yRatio: 0.02,
        scaleRatio: 0.15,
        angle: -15,
        idPrefix: 'preset-ear-l',
      },
      {
        svgFile: '/parts/ears/ear-point-right.svg',
        xRatio: 0.62,
        yRatio: 0.02,
        scaleRatio: 0.15,
        angle: 15,
        idPrefix: 'preset-ear-r',
      },
    ],
  },
];
