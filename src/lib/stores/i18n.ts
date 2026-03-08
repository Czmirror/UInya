import { writable, derived } from 'svelte/store';

export type Locale = 'ja' | 'en';

const STORAGE_KEY = 'uinya-locale';

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'ja';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'ja' || saved === 'en') return saved;
  const nav = navigator.language ?? '';
  return nav.startsWith('ja') ? 'ja' : 'en';
}

export const locale = writable<Locale>('ja');

/** Initialize locale from localStorage / navigator (call in onMount) */
export function initLocale() {
  const detected = detectLocale();
  locale.set(detected);
}

export function setLocale(l: Locale) {
  locale.set(l);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, l);
  }
}

// ── 辞書 ──

const dict = {
  ja: {
    // Header / welcome
    subtitle: 'Cat UI SVG Generator for Games',
    welcomeTitle: 'かわいい猫ゲームUIを作ろう',
    welcomeSub: 'テンプレートを選ぶか、空のキャンバスで始めましょう',
    welcomeSkip: 'スキップ — 空のキャンバスで始める',

    // Tabs
    templates: 'テンプレート',
    parts: 'パーツ',
    presetUi: '用途別UI',
    all: 'すべて',

    // Template panel
    templateHeader: '🐾 テンプレート',
    partsHeader: '🐱 パーツ',
    presetHeader: '🎮 用途別UI',
    presetDesc: '1クリックで完成UIをキャンバスに追加',
    noTemplates: 'テンプレートがありません',
    noParts: 'パーツがありません',

    // Toolbar
    add: '追加:',
    addRect: '矩形を追加',
    addRoundedRect: '角丸矩形を追加',
    addCircle: '円を追加',
    addText: 'テキストを追加',
    addLine: 'ラインを追加',
    addBezier: 'ベジエ曲線を追加',
    undo: '元に戻す',
    redo: 'やり直す',
    group: 'グループ化',
    ungroup: 'グループ解除',
    bringToFront: '最前面へ',
    bringForward: '前面へ',
    sendBackwards: '背面へ',
    sendToBack: '最背面へ',
    flipX: '水平反転',
    flipY: '垂直反転',
    grid: 'グリッド',
    snap: 'スナップ',
    deleteSelected: '選択を削除',
    clearAll: '全消去',

    // Properties panel
    properties: 'プロパティ',
    bgColor: '背景色',
    selectPrompt: '図形またはテンプレートを選択してください',
    fill: '塗り色',
    strokeColor: '線の色',
    strokeWidth: '線の太さ',
    borderRadius: '角丸',
    opacity: '透明度',
    shadow: '影',
    shadowColor: '影の色',
    blur: 'ぼかし',
    xOffset: 'X オフセット',
    yOffset: 'Y オフセット',

    // Export
    transparentPng: '透過PNG',

    // Context menu
    delete: '削除',

    // Part categories
    'cat.face': '顔',
    'cat.ear': '耳',
    'cat.eye': '目',
    'cat.nose': '鼻',
    'cat.mouth': '口',
    'cat.paw': '肉球',
    'cat.tail': 'しっぽ',
    'cat.whisker': 'ひげ',

    // Template categories
    'tpl.button': 'ボタン',
    'tpl.frame': 'フレーム',
    'tpl.gauge': 'ゲージ',
    'tpl.icon': 'アイコン',
    'tpl.textbox': 'テキスト',

    // Part names
    'part.face-round-basic': 'まる顔（ベーシック）',
    'part.face-round-soft': 'まる顔（ソフト）',
    'part.ear-point-left': 'とがり耳（左）',
    'part.ear-point-right': 'とがり耳（右）',
    'part.ear-round-left': 'まる耳（左）',
    'part.ear-round-right': 'まる耳（右）',
    'part.eye-dot': 'まんまる目',
    'part.eye-sleep': 'おやすみ目',
    'part.eye-angry': 'おこり目',
    'part.eye-happy': 'にこにこ目',
    'part.nose-triangle': 'さんかく鼻',
    'part.nose-heart': 'ハート鼻',
    'part.mouth-flat': 'まっすぐ口',
    'part.mouth-smile': 'にっこり口',
    'part.mouth-cat': 'にゃんこ口',
    'part.paw-simple': 'シンプル肉球',
    'part.tail-curve': 'カーブしっぽ',
    'part.tail-up': 'ぴんとしっぽ',
    'part.whisker-left': 'ひげ（左）',
    'part.whisker-right': 'ひげ（右）',
    'part.whisker-pair': 'ひげ',

    // Template names
    'tpl.paw-button': '肉球ボタン',
    'tpl.cat-ear-frame': '猫耳フレーム',
    'tpl.tail-gauge': 'しっぽゲージ',
    'tpl.whisker-textbox': 'ひげテキストボックス',
    'tpl.cat-icon-frame': 'にゃんこアイコンフレーム',

    // Template descriptions
    'tplDesc.paw-button': '丸いボタンに肉球の凹凸をSVGで表現したかわいいUIボタン',
    'tplDesc.cat-ear-frame': 'ダイアログやウィンドウ枠に猫耳がついたデザインフレーム',
    'tplDesc.tail-gauge': 'HPバーやMPバーがしっぽの形をしたゲージUI',
    'tplDesc.whisker-textbox': 'ひげが装飾として付いた入力欄風のテキストボックス',
    'tplDesc.cat-icon-frame': 'キャラクターアイコン用の猫耳付き丸フレーム',

    // Preset names
    'preset.rpg-hp-bar': 'RPG HPバー',
    'preset.dialog-window': '会話ウィンドウ',
    'preset.skill-button': 'スキルボタン',
    'preset.icon-frame': 'アイコンフレーム',

    // Preset descriptions
    'presetDesc.rpg-hp-bar': 'しっぽゲージ + 肉球装飾 + HPテキスト',
    'presetDesc.dialog-window': '猫耳フレーム + ひげテキストボックス + にゃんこアイコン',
    'presetDesc.skill-button': '肉球ボタン + 猫顔装飾',
    'presetDesc.icon-frame': 'にゃんこアイコンフレーム + 耳装飾',

    // Silhouettes
    silhouettes: 'シルエット',
    silhouetteHeader: '🐈‍⬛ シルエット',
    silhouetteDesc: '完成済みの猫シルエット素材',
    noSilhouettes: 'シルエットがありません',
    'sil.cat-face': '猫顔シルエット',
    'sil.cat-sit': '座り猫',
    'sil.cat-walk': '歩き猫',
    'sil.cat-loaf': '香箱猫',
    'sil.cat-sleep': '眠り猫',
    'sil.cat-stretching': '伸び猫',
    'sil.cat-grooming': '毛づくろい猫',
    'sil.cat-laying': '寝そべり猫',
    'sil.cat-looking-back': '振り向き猫',
    'sil.cat-looking-up': '見上げ猫',
    'sil.cat-rolling': 'ゴロゴロ猫',
    'sil.cat-tailwrap': 'しっぽ巻き猫',
    'sil.cat-running': '走り猫',
  },
  en: {
    subtitle: 'Cat UI SVG Generator for Games',
    welcomeTitle: 'Create cute cat game UI',
    welcomeSub: 'Pick a template or start from scratch',
    welcomeSkip: 'Skip — start with empty canvas',

    templates: 'Templates',
    parts: 'Parts',
    presetUi: 'Preset UI',
    all: 'All',

    templateHeader: '🐾 Templates',
    partsHeader: '🐱 Parts',
    presetHeader: '🎮 Preset UI',
    presetDesc: 'Add a ready-made UI to canvas with one click',
    noTemplates: 'No templates found',
    noParts: 'No parts found',

    add: 'Add:',
    addRect: 'Add Rectangle',
    addRoundedRect: 'Add Rounded Rect',
    addCircle: 'Add Circle',
    addText: 'Add Text',
    addLine: 'Add Line',
    addBezier: 'Add Bezier Curve',
    undo: 'Undo',
    redo: 'Redo',
    group: 'Group',
    ungroup: 'Ungroup',
    bringToFront: 'Bring to Front',
    bringForward: 'Bring Forward',
    sendBackwards: 'Send Backwards',
    sendToBack: 'Send to Back',
    flipX: 'Flip Horizontal',
    flipY: 'Flip Vertical',
    grid: 'Grid',
    snap: 'Snap',
    deleteSelected: 'Delete Selected',
    clearAll: 'Clear All',

    properties: 'Properties',
    bgColor: 'Background',
    selectPrompt: 'Select a shape or template',
    fill: 'Fill',
    strokeColor: 'Stroke',
    strokeWidth: 'Stroke Width',
    borderRadius: 'Border Radius',
    opacity: 'Opacity',
    shadow: 'Shadow',
    shadowColor: 'Shadow Color',
    blur: 'Blur',
    xOffset: 'X Offset',
    yOffset: 'Y Offset',

    transparentPng: 'Transparent',

    delete: 'Delete',

    'cat.face': 'Face',
    'cat.ear': 'Ears',
    'cat.eye': 'Eyes',
    'cat.nose': 'Nose',
    'cat.mouth': 'Mouth',
    'cat.paw': 'Paws',
    'cat.tail': 'Tail',
    'cat.whisker': 'Whiskers',

    'tpl.button': 'Buttons',
    'tpl.frame': 'Frames',
    'tpl.gauge': 'Gauges',
    'tpl.icon': 'Icons',
    'tpl.textbox': 'Text',

    'part.face-round-basic': 'Round Face (Basic)',
    'part.face-round-soft': 'Round Face (Soft)',
    'part.ear-point-left': 'Pointed Ear (L)',
    'part.ear-point-right': 'Pointed Ear (R)',
    'part.ear-round-left': 'Round Ear (L)',
    'part.ear-round-right': 'Round Ear (R)',
    'part.eye-dot': 'Dot Eye',
    'part.eye-sleep': 'Sleeping Eye',
    'part.eye-angry': 'Angry Eye',
    'part.eye-happy': 'Happy Eye',
    'part.nose-triangle': 'Triangle Nose',
    'part.nose-heart': 'Heart Nose',
    'part.mouth-flat': 'Flat Mouth',
    'part.mouth-smile': 'Smile Mouth',
    'part.mouth-cat': 'Cat Mouth',
    'part.paw-simple': 'Simple Paw',
    'part.tail-curve': 'Curved Tail',
    'part.tail-up': 'Up Tail',
    'part.whisker-left': 'Whisker (L)',
    'part.whisker-right': 'Whisker (R)',
    'part.whisker-pair': 'Whiskers',

    'tpl.paw-button': 'Paw Button',
    'tpl.cat-ear-frame': 'Cat Ear Frame',
    'tpl.tail-gauge': 'Tail Gauge',
    'tpl.whisker-textbox': 'Whisker Textbox',
    'tpl.cat-icon-frame': 'Cat Icon Frame',

    'tplDesc.paw-button': 'Cute round button with paw pad relief in SVG',
    'tplDesc.cat-ear-frame': 'Dialog/window frame with cat ears',
    'tplDesc.tail-gauge': 'HP/MP gauge bar shaped like a cat tail',
    'tplDesc.whisker-textbox': 'Text box decorated with cat whiskers',
    'tplDesc.cat-icon-frame': 'Round frame with cat ears for character icons',

    'preset.rpg-hp-bar': 'RPG HP Bar',
    'preset.dialog-window': 'Dialog Window',
    'preset.skill-button': 'Skill Button',
    'preset.icon-frame': 'Icon Frame',

    'presetDesc.rpg-hp-bar': 'Tail gauge + paw decoration + HP text',
    'presetDesc.dialog-window': 'Cat ear frame + whisker textbox + cat icon',
    'presetDesc.skill-button': 'Paw button + cat face decoration',
    'presetDesc.icon-frame': 'Cat icon frame + ear decoration',

    // Silhouettes
    silhouettes: 'Silhouettes',
    silhouetteHeader: '🐈‍⬛ Silhouettes',
    silhouetteDesc: 'Ready-made cat silhouette assets',
    noSilhouettes: 'No silhouettes found',
    'sil.cat-face': 'Cat Face',
    'sil.cat-sit': 'Sitting Cat',
    'sil.cat-walk': 'Walking Cat',
    'sil.cat-loaf': 'Cat Loaf',
    'sil.cat-sleep': 'Sleeping Cat',
    'sil.cat-stretching': 'Stretching Cat',
    'sil.cat-grooming': 'Grooming Cat',
    'sil.cat-laying': 'Laying Cat',
    'sil.cat-looking-back': 'Looking Back',
    'sil.cat-looking-up': 'Looking Up',
    'sil.cat-rolling': 'Rolling Cat',
    'sil.cat-tailwrap': 'Tail Wrap Cat',
    'sil.cat-running': 'Running Cat',
  }
} as const;

export type TranslationKey = keyof typeof dict.ja;

export const t = derived(locale, ($locale) => dict[$locale]);
