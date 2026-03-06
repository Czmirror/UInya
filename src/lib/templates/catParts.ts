import type { CatPart, CatPartCategory } from '$lib/types/ui';

/**
 * 新規猫パーツ規格（試験導入）
 * - 全パーツ viewBox="0 0 100 100" に統一
 * - SVGファイルは static/svg/ に配置
 * - 今回は ear-point-left のみ登録
 */
export const catParts: CatPart[] = [
  {
    id: 'ear-point-left',
    name: 'Pointed Ear (Left)',
    nameJa: 'とがり耳（左）',
    category: 'ear',
    svgFile: '/svg/ear-point-left.svg'
  }
];

export const catPartCategories: { id: CatPartCategory; label: string }[] = [
  { id: 'ear', label: '耳' },
  { id: 'eye', label: '目' },
  { id: 'mouth', label: '口' },
  { id: 'nose', label: '鼻' },
  { id: 'paw', label: '肉球' },
  { id: 'tail', label: 'しっぽ' }
];
