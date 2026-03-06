<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { editorState, exportOptions, setSelectedObjectId } from '$lib/stores/editorStore';
  import { catTemplates } from '$lib/templates/cat';
  import type { CatTemplate, CatPart } from '$lib/types/ui';
  import { base } from '$app/paths';

  const dispatch = createEventDispatcher<{ ready: void }>();

  let canvasEl: HTMLCanvasElement;
  let wrapperEl: HTMLDivElement;
  let showWelcome = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let canvas: any = null;
  let fabricModule: typeof import('fabric') | null = null;

  // Right-click context menu
  let contextMenu = { visible: false, x: 0, y: 0 };

  // Guard flag: when true, store changes should NOT be applied to canvas objects.
  // Prevents circular overwrite when selecting objects or during batch operations.
  let isSyncingFromObject = false;

  // Batch operation flag: prevents undo history from capturing intermediate states
  let isBatchOperation = false;

  // Undo/Redo history
  let history: string[] = [];
  let historyIndex = -1;
  let isRestoring = false;
  const MAX_HISTORY = 50;

  function saveState() {
    if (!canvas || isRestoring || isBatchOperation) return;
    const json = JSON.stringify(canvas.toJSON());
    history = history.slice(0, historyIndex + 1);
    history.push(json);
    if (history.length > MAX_HISTORY) {
      history = history.slice(history.length - MAX_HISTORY);
    }
    historyIndex = history.length - 1;
  }

  function restoreState(index: number) {
    if (!canvas || index < 0 || index >= history.length) return;
    isRestoring = true;
    historyIndex = index;
    canvas.loadFromJSON(history[index], () => {
      canvas.renderAll();
      isRestoring = false;
    });
  }

  // Store subscription for syncing props to selected object
  const unsubscribe = editorState.subscribe((state) => {
    if (!canvas || isSyncingFromObject) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;

    // Do NOT apply fill/stroke to groups or activeSelections —
    // they don't own individual fill/stroke and applying would overwrite children's properties
    if (obj.type === 'group' || obj.type === 'activeSelection') return;

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

  function hideContextMenu() {
    contextMenu = { visible: false, x: 0, y: 0 };
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!canvas) return;
    hideContextMenu();

    // Don't intercept keys when editing text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeObj = canvas.getActiveObject() as any;
    if (activeObj && activeObj.isEditing) return;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (isCtrlOrCmd && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault();
      redo();
    } else if (isCtrlOrCmd && e.key === 'g' && !e.shiftKey) {
      e.preventDefault();
      groupSelected();
    } else if (isCtrlOrCmd && e.key === 'g' && e.shiftKey) {
      e.preventDefault();
      ungroupSelected();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteSelected();
    }
  }

  onMount(async () => {
    fabricModule = await import('fabric');
    const { fabric } = fabricModule;

    canvas = new fabric.Canvas(canvasEl, {
      width: $editorState.canvasWidth,
      height: $editorState.canvasHeight,
      backgroundColor: '#0F3460',
      selection: true,
      preserveObjectStacking: true,
      fireRightClick: true,
      stopContextMenu: true
    });

    // 選択イベント — syncStateFromObject を先に呼び、ガードを立ててから
    // setSelectedObjectId でストアを更新する（順序が逆だと subscribe が古い値を適用してしまう）
    canvas.on('selection:created', (e: { selected: Array<{ __id?: string }> }) => {
      const obj = e.selected?.[0];
      if (obj) {
        syncStateFromObject(obj);
        setSelectedObjectId((obj as { __id?: string }).__id ?? 'selected');
      }
    });
    canvas.on('selection:updated', (e: { selected: Array<{ __id?: string }> }) => {
      const obj = e.selected?.[0];
      if (obj) {
        syncStateFromObject(obj);
        setSelectedObjectId((obj as { __id?: string }).__id ?? 'selected');
      }
    });
    canvas.on('selection:cleared', () => {
      isSyncingFromObject = true;
      setSelectedObjectId(null);
      Promise.resolve().then(() => { isSyncingFromObject = false; });
    });

    // Double-click to enter group for editing (proper ungroup with position preservation)
    canvas.on('mouse:dblclick', () => {
      const active = canvas.getActiveObject();
      if (!active || active.type !== 'group') return;

      // Batch operation: prevent intermediate state saves from object:added/removed events
      isBatchOperation = true;

      // Use fabric's toActiveSelection to properly ungroup with preserved transforms
      const activeSelection = active.toActiveSelection();
      canvas.renderAll();

      // Now discard the selection so items are individual on canvas
      canvas.discardActiveObject();
      canvas.renderAll();

      isBatchOperation = false;
      saveState();
    });

    // Right-click context menu
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.on('mouse:down', (opt: any) => {
      if (opt.button === 3) {
        // Right click
        const pointer = canvas.getPointer(opt.e);
        const canvasRect = canvasEl.getBoundingClientRect();
        contextMenu = {
          visible: true,
          x: opt.e.clientX - (wrapperEl?.getBoundingClientRect().left ?? 0),
          y: opt.e.clientY - (wrapperEl?.getBoundingClientRect().top ?? 0)
        };

        // Select object under cursor if not already selected
        const target = canvas.findTarget(opt.e);
        if (target && target !== canvas.getActiveObject()) {
          canvas.setActiveObject(target);
          canvas.renderAll();
        }
      } else {
        hideContextMenu();
      }
    });

    // Save state on object modifications for undo/redo
    canvas.on('object:added', () => { showWelcome = false; saveState(); });
    canvas.on('object:modified', () => saveState());
    canvas.on('object:removed', () => saveState());

    // Save initial empty state
    saveState();

    // Keyboard shortcuts & click-outside to close context menu
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', hideContextMenu);

    dispatch('ready');
  });

  onDestroy(() => {
    unsubscribe();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('click', hideContextMenu);
    canvas?.dispose();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function syncStateFromObject(obj: any) {
    isSyncingFromObject = true;

    // For groups/activeSelections, only sync opacity (they don't have individual fill/stroke)
    if (obj.type === 'group' || obj.type === 'activeSelection') {
      editorState.update((s) => ({
        ...s,
        opacity: Math.round((obj.opacity ?? 1) * 100)
      }));
    } else {
      editorState.update((s) => ({
        ...s,
        fillColor: obj.fill ?? s.fillColor,
        strokeColor: obj.stroke ?? s.strokeColor,
        strokeWidth: obj.strokeWidth ?? s.strokeWidth,
        borderRadius: obj.rx ?? s.borderRadius,
        opacity: Math.round((obj.opacity ?? 1) * 100)
      }));
    }

    // Keep guard active through the next microtask so that
    // setSelectedObjectId (called right after) doesn't trigger store → canvas writeback
    Promise.resolve().then(() => {
      isSyncingFromObject = false;
    });
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
          `${base}${template.svgFile}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (objects: any[], options: any) => {
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

  /** 新規猫パーツ規格: viewBox 0 0 100 100 のSVGをキャンバスに配置 */
  export async function loadPart(part: CatPart) {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;

    try {
      await new Promise<void>((resolve, reject) => {
        fabric.loadSVGFromURL(
          `${base}${part.svgFile}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (objects: any[], options: any) => {
            if (!objects || objects.length === 0) {
              reject(new Error('Part SVG load failed'));
              return;
            }

            const group = fabric.util.groupSVGElements(objects, options);
            // パーツは小さめ（キャンバスの30%）で配置
            const canvasW = canvas.getWidth();
            const canvasH = canvas.getHeight();
            const scale = Math.min(
              (canvasW * 0.3) / (group.width ?? 100),
              (canvasH * 0.3) / (group.height ?? 100)
            );

            group.set({
              left: canvasW / 2 - ((group.width ?? 100) * scale) / 2,
              top: canvasH / 2 - ((group.height ?? 100) * scale) / 2,
              scaleX: scale,
              scaleY: scale
            });
            (group as { __id?: string }).__id = `part_${part.id}_${Date.now()}`;
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.renderAll();
            resolve();
          }
        );
      });
    } catch (e) {
      console.error('Failed to load part SVG:', e);
    }
  }

  export function groupSelected() {
    if (!canvas || !fabricModule) return;
    const activeSelection = canvas.getActiveObject();
    if (!activeSelection || activeSelection.type !== 'activeSelection') return;

    isBatchOperation = true;
    // Use fabric's toGroup() to properly group an activeSelection
    const group = activeSelection.toGroup();
    (group as { __id?: string }).__id = `group_${Date.now()}`;
    canvas.renderAll();
    isBatchOperation = false;
    saveState();
  }

  export function ungroupSelected() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'group') return;

    isBatchOperation = true;
    // Use toActiveSelection to preserve transforms
    active.toActiveSelection();
    canvas.discardActiveObject();
    canvas.renderAll();
    isBatchOperation = false;
    saveState();
  }

  // Layer ordering
  export function bringToFront() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringToFront(active);
    canvas.renderAll();
    saveState();
  }

  export function sendToBack() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendToBack(active);
    canvas.renderAll();
    saveState();
  }

  export function bringForward() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringForward(active);
    canvas.renderAll();
    saveState();
  }

  export function sendBackwards() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendBackwards(active);
    canvas.renderAll();
    saveState();
  }

  export function deleteSelected() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    isBatchOperation = true;
    if (active.type === 'activeSelection') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      active.getObjects().forEach((obj: any) => canvas.remove(obj));
    } else {
      canvas.remove(active);
    }
    canvas.discardActiveObject();
    canvas.renderAll();
    isBatchOperation = false;
    saveState();
  }

  export function clearAll() {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#0F3460';
    canvas.renderAll();
  }

  export function setBackgroundColor(color: string | null) {
    if (!canvas) return;
    canvas.backgroundColor = color || '';
    canvas.renderAll();
    saveState();
  }

  export function undo() {
    if (historyIndex > 0) {
      restoreState(historyIndex - 1);
    }
  }

  export function redo() {
    if (historyIndex < history.length - 1) {
      restoreState(historyIndex + 1);
    }
  }

  export function exportSvg(): string {
    if (!canvas) return '';
    const bg = canvas.backgroundColor;
    const hasBg = bg && bg !== '';
    // Keep background if user has it enabled, remove if empty
    if (!hasBg) {
      canvas.backgroundColor = '';
    }
    const svg = canvas.toSVG({
      width: $exportOptions.width,
      height: $exportOptions.height,
      viewBox: {
        x: 0,
        y: 0,
        width: $editorState.canvasWidth,
        height: $editorState.canvasHeight
      }
    });
    return svg;
  }

  export function exportPng(): string {
    if (!canvas) return '';
    const savedBg = canvas.backgroundColor;
    if ($exportOptions.transparent) {
      canvas.backgroundColor = '';
    }
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: $exportOptions.width / $editorState.canvasWidth,
      enableRetinaScaling: false
    });
    if ($exportOptions.transparent) {
      canvas.backgroundColor = savedBg;
    }
    return dataUrl;
  }

  // Context menu action helper
  function ctxAction(fn: () => void) {
    fn();
    hideContextMenu();
  }
</script>

<div class="flex-1 flex items-center justify-center overflow-auto bg-[#111827] p-4 relative" bind:this={wrapperEl}>
  <div class="shadow-2xl shadow-black/60 rounded-lg overflow-hidden border border-white/10">
    <canvas bind:this={canvasEl}></canvas>
  </div>

  <!-- Welcome showcase overlay -->
  {#if showWelcome}
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-[#111827]/80 z-40 backdrop-blur-sm">
      <p class="text-white/70 text-lg font-bold mb-1">Create cute cat game UI</p>
      <p class="text-white/40 text-sm mb-5">Pick a template or start from scratch</p>
      <div class="flex gap-4 flex-wrap justify-center max-w-xl px-4">
        {#each catTemplates.slice(0, 5) as template (template.id)}
          <button
            class="w-24 rounded-xl overflow-hidden bg-dark-panel border border-white/10
              hover:border-cat-pink/60 hover:scale-105 transition-all group"
            on:click={() => { showWelcome = false; loadTemplate(template); }}
          >
            <div class="w-full bg-white/5 flex items-center justify-center p-2 h-20 overflow-hidden">
              <img
                src="{base}{template.thumbnail}"
                alt={template.nameJa}
                class="max-h-full max-w-full object-contain"
              />
            </div>
            <p class="text-white/70 text-[10px] font-semibold text-center py-1 px-1 truncate">{template.nameJa}</p>
          </button>
        {/each}
      </div>
      <button
        class="mt-5 text-white/30 text-xs hover:text-white/60 transition-colors"
        on:click={() => { showWelcome = false; }}
      >
        Skip — start with empty canvas
      </button>
    </div>
  {/if}

  <!-- Right-click context menu -->
  {#if contextMenu.visible}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="ctx-menu"
      style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
      on:click|stopPropagation
    >
      {#if $editorState.selectedObjectId}
        <button class="ctx-item" on:click={() => ctxAction(deleteSelected)}>
          <span>削除</span><span class="ctx-shortcut">Delete</span>
        </button>
        <hr class="border-white/10" />
        <button class="ctx-item" on:click={() => ctxAction(bringToFront)}>
          <span>最前面へ</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(bringForward)}>
          <span>前面へ</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(sendBackwards)}>
          <span>背面へ</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(sendToBack)}>
          <span>最背面へ</span>
        </button>
        <hr class="border-white/10" />
        <button class="ctx-item" on:click={() => ctxAction(groupSelected)}>
          <span>グループ化</span><span class="ctx-shortcut">Ctrl+G</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(ungroupSelected)}>
          <span>グループ解除</span><span class="ctx-shortcut">Ctrl+Shift+G</span>
        </button>
      {:else}
        <button class="ctx-item" on:click={() => ctxAction(undo)}>
          <span>元に戻す</span><span class="ctx-shortcut">Ctrl+Z</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(redo)}>
          <span>やり直す</span><span class="ctx-shortcut">Ctrl+Shift+Z</span>
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .ctx-menu {
    @apply absolute z-50 bg-dark-panel border border-white/20 rounded-lg shadow-xl shadow-black/50
      py-1 min-w-[180px] overflow-hidden;
  }
  .ctx-item {
    @apply w-full flex items-center justify-between px-3 py-1.5 text-sm text-white/80
      hover:bg-white/10 hover:text-white transition-colors text-left;
  }
  .ctx-shortcut {
    @apply text-white/30 text-xs ml-4;
  }
</style>
