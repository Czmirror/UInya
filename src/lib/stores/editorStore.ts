import { writable, derived } from 'svelte/store';
import type { EditorState, CatTemplate, ExportOptions } from '$lib/types/ui';

const initialState: EditorState = {
  selectedObjectId: null,
  fillColor: '#FFB7C5',
  strokeColor: '#E91E8C',
  strokeWidth: 2,
  borderRadius: 20,
  opacity: 100,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowBlur: 10,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  canvasWidth: 512,
  canvasHeight: 512,
  fontFamily: 'system-ui, sans-serif',
  activeTemplate: null,
  zoom: 1
};

export const editorState = writable<EditorState>(initialState);

/** Font family options available in the font selector */
export const fontFamilyOptions = [
  { value: 'system-ui, sans-serif', labelJa: '標準', labelEn: 'System' },
  { value: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif', labelJa: 'ヒラギノ', labelEn: 'Hiragino Sans' },
  { value: '"Yu Gothic", "YuGothic", sans-serif', labelJa: '游ゴシック', labelEn: 'Yu Gothic' },
  { value: '"Noto Sans JP", sans-serif', labelJa: 'Noto Sans JP', labelEn: 'Noto Sans JP' },
  { value: 'Inter, sans-serif', labelJa: 'Inter', labelEn: 'Inter' },
  { value: 'Poppins, sans-serif', labelJa: 'Poppins', labelEn: 'Poppins' }
] as const;

// グリッド表示・スナップ機能の状態（editorStateとは独立して管理）
export const gridEnabled = writable(false);
export const snapEnabled = writable(false);

export const exportOptions = writable<ExportOptions>({
  format: 'svg',
  width: 512,
  height: 512,
  transparent: true,
  scale: 1
});

export const hasSelection = derived(
  editorState,
  ($state) => $state.selectedObjectId !== null
);

export function updateFill(color: string) {
  editorState.update((s) => ({ ...s, fillColor: color }));
}

export function updateStroke(color: string, width?: number) {
  editorState.update((s) => ({
    ...s,
    strokeColor: color,
    strokeWidth: width ?? s.strokeWidth
  }));
}

export function updateBorderRadius(radius: number) {
  editorState.update((s) => ({ ...s, borderRadius: radius }));
}

export function updateOpacity(opacity: number) {
  editorState.update((s) => ({ ...s, opacity }));
}

export function updateShadow(
  enabled: boolean,
  color?: string,
  blur?: number,
  offsetX?: number,
  offsetY?: number
) {
  editorState.update((s) => ({
    ...s,
    shadowEnabled: enabled,
    shadowColor: color ?? s.shadowColor,
    shadowBlur: blur ?? s.shadowBlur,
    shadowOffsetX: offsetX ?? s.shadowOffsetX,
    shadowOffsetY: offsetY ?? s.shadowOffsetY
  }));
}

export function updateFontFamily(fontFamily: string) {
  editorState.update((s) => ({ ...s, fontFamily }));
}

export function setActiveTemplate(template: CatTemplate | null) {
  editorState.update((s) => ({ ...s, activeTemplate: template }));
}

export function setSelectedObjectId(id: string | null) {
  editorState.update((s) => ({ ...s, selectedObjectId: id }));
}
