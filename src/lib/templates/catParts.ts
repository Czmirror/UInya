import type { CatPart, CatPartCategory } from '$lib/types/ui';

/**
 * 猫パーツ定義
 * - 全パーツ viewBox="0 0 100 100" に統一
 * - SVGファイルは static/parts/<category>/ に配置
 */
export const catParts: CatPart[] = [
  // ── 顔ベース ──
  {
    id: 'face-round-basic',
    name: 'Round Face (Basic)',
    nameJa: 'まる顔（ベーシック）',
    category: 'face',
    svgFile: '/parts/face/face-round-basic.svg'
  },
  {
    id: 'face-round-soft',
    name: 'Round Face (Soft)',
    nameJa: 'まる顔（ソフト）',
    category: 'face',
    svgFile: '/parts/face/face-round-soft.svg'
  },

  // ── 耳 ──
  {
    id: 'ear-point-left',
    name: 'Pointed Ear (Left)',
    nameJa: 'とがり耳（左）',
    category: 'ear',
    svgFile: '/parts/ears/ear-point-left.svg'
  },
  {
    id: 'ear-point-right',
    name: 'Pointed Ear (Right)',
    nameJa: 'とがり耳（右）',
    category: 'ear',
    svgFile: '/parts/ears/ear-point-right.svg'
  },
  {
    id: 'ear-round-left',
    name: 'Round Ear (Left)',
    nameJa: 'まる耳（左）',
    category: 'ear',
    svgFile: '/parts/ears/ear-round-left.svg'
  },
  {
    id: 'ear-round-right',
    name: 'Round Ear (Right)',
    nameJa: 'まる耳（右）',
    category: 'ear',
    svgFile: '/parts/ears/ear-round-right.svg'
  },

  // ── 目 ──
  {
    id: 'eye-dot',
    name: 'Dot Eye',
    nameJa: 'まんまる目',
    category: 'eye',
    svgFile: '/parts/eyes/eye-dot.svg'
  },
  {
    id: 'eye-sleep',
    name: 'Sleeping Eye',
    nameJa: 'おやすみ目',
    category: 'eye',
    svgFile: '/parts/eyes/eye-sleep.svg'
  },
  {
    id: 'eye-angry',
    name: 'Angry Eye',
    nameJa: 'おこり目',
    category: 'eye',
    svgFile: '/parts/eyes/eye-angry.svg'
  },
  {
    id: 'eye-happy',
    name: 'Happy Eye',
    nameJa: 'にこにこ目',
    category: 'eye',
    svgFile: '/parts/eyes/eye-happy.svg'
  },

  // ── 鼻 ──
  {
    id: 'nose-triangle',
    name: 'Triangle Nose',
    nameJa: 'さんかく鼻',
    category: 'nose',
    svgFile: '/parts/nose/nose-triangle.svg'
  },
  {
    id: 'nose-heart',
    name: 'Heart Nose',
    nameJa: 'ハート鼻',
    category: 'nose',
    svgFile: '/parts/nose/nose-heart.svg'
  },

  // ── 口 ──
  {
    id: 'mouth-flat',
    name: 'Flat Mouth',
    nameJa: 'まっすぐ口',
    category: 'mouth',
    svgFile: '/parts/mouth/mouth-flat.svg'
  },
  {
    id: 'mouth-smile',
    name: 'Smile Mouth',
    nameJa: 'にっこり口',
    category: 'mouth',
    svgFile: '/parts/mouth/mouth-smile.svg'
  },
  {
    id: 'mouth-cat',
    name: 'Cat Mouth',
    nameJa: 'にゃんこ口',
    category: 'mouth',
    svgFile: '/parts/mouth/mouth-cat.svg'
  },

  // ── 肉球 ──
  {
    id: 'paw-simple',
    name: 'Simple Paw',
    nameJa: 'シンプル肉球',
    category: 'paw',
    svgFile: '/parts/paws/paw-simple.svg'
  },

  // ── しっぽ ──
  {
    id: 'tail-curve',
    name: 'Curved Tail',
    nameJa: 'カーブしっぽ',
    category: 'tail',
    svgFile: '/parts/tails/tail-curve.svg'
  },
  {
    id: 'tail-up',
    name: 'Up Tail',
    nameJa: 'ぴんとしっぽ',
    category: 'tail',
    svgFile: '/parts/tails/tail-up.svg'
  }
];

export const catPartCategories: { id: CatPartCategory; label: string }[] = [
  { id: 'face', label: '顔' },
  { id: 'ear', label: '耳' },
  { id: 'eye', label: '目' },
  { id: 'nose', label: '鼻' },
  { id: 'mouth', label: '口' },
  { id: 'paw', label: '肉球' },
  { id: 'tail', label: 'しっぽ' }
];
