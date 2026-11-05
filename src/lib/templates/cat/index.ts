// Defines the editor’s SVG template collections and the starting shelf.
import type { CatTemplate } from '$lib/types/ui';

const classicTemplates: CatTemplate[] = [
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

const collectionIds = ['strawberry', 'honey', 'peach'] as const;
type NewCollection = (typeof collectionIds)[number];

export const templateCollectionIds = ['featured', ...collectionIds, 'classic'] as const;
export type TemplateCollection = (typeof templateCollectionIds)[number];

const designs = {
  strawberry: [
    ['Paw Button', '肉球ボタン'], ['Strawberry Cat Frame', 'いちご猫耳フレーム'],
    ['Paw Tail Gauge', '肉球しっぽゲージ'], ['Strawberry Whisker Box', 'いちごひげ入力欄'],
    ['Calico Avatar Frame', '三毛猫アバターフレーム'],
  ],
  honey: [
    ['Calico Action Button', '三毛猫ボタン'], ['Honey Cat Dialog', 'はちみつ猫耳ダイアログ'],
    ['Honey Tail Gauge', 'はちみつしっぽゲージ'], ['Honey Whisker Box', 'はちみつひげ入力欄'],
    ['Honey Avatar Frame', 'はちみつアバターフレーム'],
  ],
  peach: [
    ['Peach Cat Button', 'もも猫ボタン'], ['Peach Whisker Frame', 'ももひげフレーム'],
    ['Striped Tail Gauge', 'しましっぽゲージ'], ['Bell Whisker Box', '鈴つきひげ入力欄'],
    ['Peach Avatar Frame', 'ももアバターフレーム'],
  ],
} as const;

const templateKinds = [
  ['button', 'button'], ['frame', 'frame'], ['gauge', 'gauge'],
  ['textbox', 'textbox'], ['avatar', 'icon'],
] as const;

/** Builds shelf entries whose preview and editable SVG refer to the same asset. */
function collectionTemplates(collection: NewCollection): CatTemplate[] {
  return templateKinds.map(([file, category], index) => {
    const [name, nameJa] = designs[collection][index];
    const svgFile = `/templates/collections/${collection}/${file}.svg`;
    return { id: `${collection}-${file}`, name, nameJa, category, svgFile, thumbnail: svgFile, description: '' };
  });
}

const strawberryTemplates = collectionTemplates('strawberry');
const honeyTemplates = collectionTemplates('honey');

// Keep the calico avatar as the final card on the featured shelf.
export const featuredTemplates = [
  ...honeyTemplates.filter(template => template.category !== 'icon'),
  ...strawberryTemplates.filter(template => template.category === 'icon'),
];

export const templateCollections: Record<TemplateCollection, CatTemplate[]> = {
  featured: featuredTemplates,
  strawberry: strawberryTemplates,
  honey: honeyTemplates,
  peach: collectionTemplates('peach'),
  classic: classicTemplates,
};

export const templateCategories = [
  { id: 'button', label: 'ボタン', emoji: '🐾' },
  { id: 'frame', label: 'フレーム', emoji: '🖼️' },
  { id: 'gauge', label: 'ゲージ', emoji: '📊' },
  { id: 'icon', label: 'アイコン', emoji: '😺' },
  { id: 'textbox', label: 'テキスト', emoji: '✍️' }
] as const;
