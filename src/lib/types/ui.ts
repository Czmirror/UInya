// Defines the shared editor, asset and export types.
export type TemplateCategory = 'button' | 'frame' | 'gauge' | 'icon' | 'textbox';

/** 既存テンプレート（複合UI素材） */
export interface CatTemplate {
  id: string;
  name: string;
  nameJa: string;
  category: TemplateCategory;
  svgFile: string;
  thumbnail: string;
  description: string;
}

/** 新規: 猫パーツ規格（viewBox 0 0 100 100 統一） */
export type CatPartCategory = 'face' | 'body' | 'marking' | 'ear' | 'eye' | 'mouth' | 'nose' | 'paw' | 'tail' | 'whisker' | 'expression' | 'accent';

export interface CatPart {
  id: string;
  name: string;
  nameJa: string;
  category: CatPartCategory;
  svgFile: string;
  /** Positions a face layer in the shared 100×100 mascot coordinate space. */
  alignToMascot?: boolean;
}

export interface EditorState {
  selectedObjectId: string | null;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
  opacity: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  canvasWidth: number;
  canvasHeight: number;
  fontFamily: string;
  activeTemplate: CatTemplate | null;
  zoom: number;
}

export interface ExportOptions {
  format: 'svg' | 'png';
  width: number;
  height: number;
  transparent: boolean;
  scale: number;
}
