import type { CatTemplate } from '$lib/types/ui';

export const catTemplates: CatTemplate[] = [
  {
    id: 'paw-button',
    name: 'Paw Button',
    nameJa: '肉球ボタン',
    category: 'button',
    svgFile: '/templates/buttons/paw-button.svg',
    thumbnail: '/templates/buttons/paw-button.svg',
    description: '丸いボタンに肉球の凹凸をSVGで表現したかわいいUIボタン'
  },
  {
    id: 'cat-ear-frame',
    name: 'Cat Ear Frame',
    nameJa: '猫耳フレーム',
    category: 'frame',
    svgFile: '/templates/frames/cat-ear-frame.svg',
    thumbnail: '/templates/frames/cat-ear-frame.svg',
    description: 'ダイアログやウィンドウ枠に猫耳がついたデザインフレーム'
  },
  {
    id: 'tail-gauge',
    name: 'Tail Gauge',
    nameJa: 'しっぽゲージ',
    category: 'gauge',
    svgFile: '/templates/gauges/tail-gauge.svg',
    thumbnail: '/templates/gauges/tail-gauge.svg',
    description: 'HPバーやMPバーがしっぽの形をしたゲージUI'
  },
  {
    id: 'whisker-textbox',
    name: 'Whisker Textbox',
    nameJa: 'ひげテキストボックス',
    category: 'textbox',
    svgFile: '/templates/text/whisker-textbox.svg',
    thumbnail: '/templates/text/whisker-textbox.svg',
    description: 'ひげが装飾として付いた入力欄風のテキストボックス'
  },
  {
    id: 'cat-icon-frame',
    name: 'Cat Icon Frame',
    nameJa: 'にゃんこアイコンフレーム',
    category: 'icon',
    svgFile: '/templates/icons/cat-icon-frame.svg',
    thumbnail: '/templates/icons/cat-icon-frame.svg',
    description: 'キャラクターアイコン用の猫耳付き丸フレーム'
  }
];

export const templateCategories = [
  { id: 'button', label: 'ボタン', emoji: '🐾' },
  { id: 'frame', label: 'フレーム', emoji: '🖼️' },
  { id: 'gauge', label: 'ゲージ', emoji: '📊' },
  { id: 'icon', label: 'アイコン', emoji: '😺' },
  { id: 'textbox', label: 'テキスト', emoji: '✍️' }
] as const;
