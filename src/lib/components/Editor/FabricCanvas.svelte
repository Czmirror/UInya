<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { editorState, exportOptions, setSelectedObjectId } from '$lib/stores/editorStore';
  import type { CatTemplate } from '$lib/types/ui';

  const dispatch = createEventDispatcher<{ ready: void }>();

  let canvasEl: HTMLCanvasElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let canvas: any = null;
  let fabricModule: typeof import('fabric') | null = null;

  // Store subscription for syncing props to selected object
  const unsubscribe = editorState.subscribe((state) => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;

    obj.set({
      fill: state.fillColor,
      stroke: state.strokeColor,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity / 100
    });

    if ('rx' in obj) {
      obj.set({ rx: state.borderRadius, ry: state.borderRadius });
    }

    if (state.shadowEnabled) {
      obj.set({
        shadow: new (fabricModule as typeof import('fabric')).fabric.Shadow({
          color: state.shadowColor,
          blur: state.shadowBlur,
          offsetX: state.shadowOffsetX,
          offsetY: state.shadowOffsetY
        })
      });
    } else {
      obj.set({ shadow: null });
    }

    canvas.renderAll();
  });

  onMount(async () => {
    fabricModule = await import('fabric');
    const { fabric } = fabricModule;

    canvas = new fabric.Canvas(canvasEl, {
      width: $editorState.canvasWidth,
      height: $editorState.canvasHeight,
      backgroundColor: '#0F3460',
      selection: true,
      preserveObjectStacking: true
    });

    // 選択イベント
    canvas.on('selection:created', (e: { selected: Array<{ __id?: string }> }) => {
      const obj = e.selected?.[0];
      if (obj) {
        setSelectedObjectId((obj as { __id?: string }).__id ?? 'selected');
        syncStateFromObject(obj);
      }
    });
    canvas.on('selection:updated', (e: { selected: Array<{ __id?: string }> }) => {
      const obj = e.selected?.[0];
      if (obj) {
        setSelectedObjectId((obj as { __id?: string }).__id ?? 'selected');
        syncStateFromObject(obj);
      }
    });
    canvas.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });

    dispatch('ready');
  });

  onDestroy(() => {
    unsubscribe();
    canvas?.dispose();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function syncStateFromObject(obj: any) {
    editorState.update((s) => ({
      ...s,
      fillColor: obj.fill ?? s.fillColor,
      strokeColor: obj.stroke ?? s.strokeColor,
      strokeWidth: obj.strokeWidth ?? s.strokeWidth,
      borderRadius: obj.rx ?? s.borderRadius,
      opacity: Math.round((obj.opacity ?? 1) * 100)
    }));
  }

  export function addRect() {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const state = $editorState;
    const rect = new fabric.Rect({
      left: 60,
      top: 60,
      width: 200,
      height: 80,
      fill: state.fillColor,
      stroke: state.strokeColor,
      strokeWidth: state.strokeWidth
    });
    (rect as { __id?: string }).__id = `rect_${Date.now()}`;
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }

  export function addRoundedRect() {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const state = $editorState;
    const rect = new fabric.Rect({
      left: 60,
      top: 60,
      width: 200,
      height: 80,
      rx: state.borderRadius,
      ry: state.borderRadius,
      fill: state.fillColor,
      stroke: state.strokeColor,
      strokeWidth: state.strokeWidth
    });
    (rect as { __id?: string }).__id = `rrect_${Date.now()}`;
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }

  export function addCircle() {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const state = $editorState;
    const circle = new fabric.Circle({
      left: 80,
      top: 80,
      radius: 60,
      fill: state.fillColor,
      stroke: state.strokeColor,
      strokeWidth: state.strokeWidth
    });
    (circle as { __id?: string }).__id = `circle_${Date.now()}`;
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }

  export function addText() {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const text = new fabric.IText('にゃんテキスト', {
      left: 80,
      top: 160,
      fontSize: 32,
      fontFamily: 'Nunito, sans-serif',
      fill: $editorState.fillColor,
      fontWeight: '700'
    });
    (text as { __id?: string }).__id = `text_${Date.now()}`;
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  export async function loadTemplate(template: CatTemplate) {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;

    try {
      await new Promise<void>((resolve, reject) => {
        fabric.loadSVGFromURL(
          template.svgFile,
          (objects: fabric.Object[], options: fabric.IGroupOptions) => {
            if (!objects || objects.length === 0) {
              reject(new Error('SVG load failed'));
              return;
            }
            const group = fabric.util.groupSVGElements(objects, options);
            const canvasW = canvas.getWidth();
            const canvasH = canvas.getHeight();
            const scale = Math.min(
              (canvasW * 0.7) / (group.width ?? 200),
              (canvasH * 0.7) / (group.height ?? 200)
            );
            group.set({
              left: canvasW / 2 - ((group.width ?? 200) * scale) / 2,
              top: canvasH / 2 - ((group.height ?? 200) * scale) / 2,
              scaleX: scale,
              scaleY: scale
            });
            (group as { __id?: string }).__id = `template_${template.id}_${Date.now()}`;
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.renderAll();
            resolve();
          }
        );
      });
    } catch (e) {
      console.error('Failed to load template SVG:', e);
    }
  }

  export function deleteSelected() {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }

  export function clearAll() {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#0F3460';
    canvas.renderAll();
  }

  export function undo() {
    // Fabric v5 does not have built-in undo/redo; placeholder
    console.log('undo not implemented yet');
  }

  export function redo() {
    console.log('redo not implemented yet');
  }

  export function exportSvg(): string {
    if (!canvas) return '';
    return canvas.toSVG({
      width: $exportOptions.width,
      height: $exportOptions.height,
      viewBox: {
        x: 0,
        y: 0,
        width: $editorState.canvasWidth,
        height: $editorState.canvasHeight
      }
    });
  }

  export function exportPng(): string {
    if (!canvas) return '';
    return canvas.toDataURL({
      format: 'png',
      multiplier: $exportOptions.width / $editorState.canvasWidth,
      enableRetinaScaling: false
    });
  }
</script>

<div class="flex-1 flex items-center justify-center overflow-auto bg-[#111827] p-4">
  <div class="shadow-2xl shadow-black/60 rounded-lg overflow-hidden border border-white/10">
    <canvas bind:this={canvasEl}></canvas>
  </div>
</div>
