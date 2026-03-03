export type TemplateCategory = 'button' | 'frame' | 'gauge' | 'icon' | 'textbox';

export interface CatTemplate {
  id: string;
  name: string;
  nameJa: string;
  category: TemplateCategory;
  svgFile: string;
  thumbnail: string;
  description: string;
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
