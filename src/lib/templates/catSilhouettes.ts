export interface CatSilhouette {
  id: string;
  name: string;
  nameJa: string;
  svgFile: string;
}

/**
 * 猫シルエット定義
 * - 完成済みの単体素材として扱う
 * - SVGファイルは static/silhouettes/ に配置
 */
export const catSilhouettes: CatSilhouette[] = [
  {
    id: 'cat-face',
    name: 'Cat Face',
    nameJa: '猫顔シルエット',
    svgFile: '/silhouettes/cat-face.svg'
  },
  {
    id: 'cat-sit',
    name: 'Sitting Cat',
    nameJa: '座り猫',
    svgFile: '/silhouettes/cat-sit.svg'
  },
  {
    id: 'cat-walk',
    name: 'Walking Cat',
    nameJa: '歩き猫',
    svgFile: '/silhouettes/cat-walk.svg'
  },
  {
    id: 'cat-loaf',
    name: 'Cat Loaf',
    nameJa: '香箱猫',
    svgFile: '/silhouettes/cat-loaf.svg'
  },
  {
    id: 'cat-sleep',
    name: 'Sleeping Cat',
    nameJa: '眠り猫',
    svgFile: '/silhouettes/cat-sleep.svg'
  },
  {
    id: 'cat-stretching',
    name: 'Stretching Cat',
    nameJa: '伸び猫',
    svgFile: '/silhouettes/cat-stretching.svg'
  },
  {
    id: 'cat-grooming',
    name: 'Grooming Cat',
    nameJa: '毛づくろい猫',
    svgFile: '/silhouettes/cat-grooming.svg'
  },
  {
    id: 'cat-laying',
    name: 'Laying Cat',
    nameJa: '寝そべり猫',
    svgFile: '/silhouettes/cat-laying.svg'
  },
  {
    id: 'cat-looking-back',
    name: 'Looking Back Cat',
    nameJa: '振り向き猫',
    svgFile: '/silhouettes/cat-looking-back.svg'
  },
  {
    id: 'cat-looking-up',
    name: 'Looking Up Cat',
    nameJa: '見上げ猫',
    svgFile: '/silhouettes/cat-looking-up.svg'
  },
  {
    id: 'cat-rolling',
    name: 'Rolling Cat',
    nameJa: 'ゴロゴロ猫',
    svgFile: '/silhouettes/cat-rolling.svg'
  },
  {
    id: 'cat-tailwrap',
    name: 'Tail Wrap Cat',
    nameJa: 'しっぽ巻き猫',
    svgFile: '/silhouettes/cat-tailwrap.svg'
  },
  {
    id: 'cat-running',
    name: 'Running Cat',
    nameJa: '走り猫',
    svgFile: '/silhouettes/cat-running.svg'
  }
];
