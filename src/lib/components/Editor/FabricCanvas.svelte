<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { editorState, exportOptions, setSelectedObjectId, gridEnabled, snapEnabled } from '$lib/stores/editorStore';
  import { catTemplates } from '$lib/templates/cat';
  import type { CatTemplate, CatPart } from '$lib/types/ui';
  import type { UIPreset } from '$lib/templates/presets';
  import type { CatSilhouette } from '$lib/templates/catSilhouettes';
  import { base } from '$app/paths';
  import { t } from '$lib/stores/i18n';
  import { generateRandomLayout } from '$lib/templates/randomCatUi';
  import type { RandomResult } from '$lib/templates/randomCatUi';

  const dispatch = createEventDispatcher<{ ready: void }>();

  // スナップ閾値（px）— 調整しやすいよう定数化
  const SNAP_THRESHOLD = 8;
  const GRID_SIZE = 25;

  let canvasEl: HTMLCanvasElement;
  let wrapperEl: HTMLDivElement;
  let showWelcome = true;

  // スナップガイドライン（ドラッグ中のプレビュー表示用）
  let snapGuides: { x: number | null; y: number | null } = { x: null, y: null };
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

  // Child-edit mode: tracks ungrouped children so they can be re-grouped on exit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let childEditObjects: any[] | null = null;

  // Random Cat UI tracking: IDs of generated objects + last theme for shuffle
  let randomObjectIds: string[] = [];
  let lastRandomThemeId: string | null = null;

  // Undo/Redo history
  let history: string[] = [];
  let historyIndex = -1;
  let isRestoring = false;
  const MAX_HISTORY = 50;

  // Debounce timer for property-change history saves (e.g. color picker drag)
  let propSaveTimer: ReturnType<typeof setTimeout> | null = null;
  const PROP_SAVE_DELAY = 300; // ms

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
    // Flush any pending property-change save so it doesn't overwrite the restored state
    if (propSaveTimer) {
      clearTimeout(propSaveTimer);
      propSaveTimer = null;
    }
    isRestoring = true;
    historyIndex = index;
    canvas.loadFromJSON(history[index], () => {
      canvas.renderAll();
      // Selection is lost after loadFromJSON — clear editor state selection
      isSyncingFromObject = true;
      setSelectedObjectId(null);
      Promise.resolve().then(() => {
        isSyncingFromObject = false;
        isRestoring = false;
      });
    });
  }

  // Schedule a debounced history save for property changes (color, font, etc.)
  function schedulePropSave() {
    if (propSaveTimer) clearTimeout(propSaveTimer);
    propSaveTimer = setTimeout(() => {
      propSaveTimer = null;
      saveState();
    }, PROP_SAVE_DELAY);
  }

  // Store subscription for syncing props to selected object
  const unsubscribe = editorState.subscribe((state) => {
    if (!canvas || isSyncingFromObject || isRestoring) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;

    // For groups: propagate fill/stroke to all child objects for uniform color change
    if (obj.type === 'group' || obj.type === 'activeSelection') {
      obj.set({ opacity: state.opacity / 100 });
      if (obj._objects) {
        for (const child of obj._objects) {
          // Only set fill on children that originally have a fill (skip stroke-only elements)
          if (child.fill && child.fill !== 'none' && child.fill !== '') {
            child.set({ fill: state.fillColor });
          }
          // Apply stroke color/width to children that have stroke
          if (child.stroke && child.stroke !== 'none' && child.stroke !== '') {
            child.set({ stroke: state.strokeColor, strokeWidth: state.strokeWidth });
          }
        }
      }
      canvas.renderAll();
      schedulePropSave();
      return;
    }

    obj.set({
      fill: state.fillColor,
      stroke: state.strokeColor,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity / 100
    });

    // Apply fontFamily to text objects
    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      obj.set({ fontFamily: state.fontFamily });
    }

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
    schedulePropSave();
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
    } else if (e.key === 'Escape') {
      if (childEditObjects) {
        e.preventDefault();
        exitChildEditMode();
      }
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

    // Double-click to enter group child-edit mode
    canvas.on('mouse:dblclick', () => {
      const active = canvas.getActiveObject();
      if (!active || active.type !== 'group') return;

      // Exit any existing child-edit mode first
      exitChildEditMode();

      isBatchOperation = true;

      // Snapshot existing canvas object set before ungroup
      const existingSet = new Set(canvas.getObjects());

      // Ungroup: use fabric's toActiveSelection to properly split with preserved transforms
      active.toActiveSelection();
      canvas.discardActiveObject();
      canvas.renderAll();

      // Identify the newly-added children (objects not in the pre-ungroup set)
      const newChildren: any[] = [];
      for (const obj of canvas.getObjects()) {
        if (!existingSet.has(obj)) {
          newChildren.push(obj);
        }
      }

      // Upgrade fabric.Text → fabric.IText for editability
      const { fabric } = fabricModule!;
      for (let i = 0; i < newChildren.length; i++) {
        const obj = newChildren[i];
        if (obj.type === 'text') {
          const itext = new fabric.IText(obj.text, obj.toObject());
          itext.set({ left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY, angle: obj.angle });
          canvas.insertAt(itext, canvas.getObjects().indexOf(obj));
          canvas.remove(obj);
          newChildren[i] = itext;
        }
      }

      childEditObjects = newChildren;

      canvas.renderAll();
      isBatchOperation = false;
      saveState();
    });

    // Right-click context menu
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.on('mouse:down', (opt: any) => {
      if (opt.button === 3) {
        // Right click
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

        // Child-edit mode: click on empty space → exit child-edit mode
        if (childEditObjects) {
          const target = opt.target;
          if (!target) {
            // Clicked on empty space — exit child-edit mode
            exitChildEditMode();
          } else if (!childEditObjects.includes(target)) {
            // Clicked on an object that's NOT one of the child-edit objects — also exit
            exitChildEditMode();
          }
        }
      }
    });

    // --- スナップ: 候補検出・ガイド表示・最終吸着確定を分離 ---

    /** スナップ候補を検出し、最も近いX/Yの吸着量を返す */
    function findSnapCandidates(target: any): { dx: number | null; dy: number | null; snapX: number | null; snapY: number | null } {
      const bound = target.getBoundingRect(true);
      const tCenterX = bound.left + bound.width / 2;
      const tCenterY = bound.top + bound.height / 2;

      // キャンバス中心・端もスナップ対象
      const snapXCandidates = [0, canvas.getWidth() / 2, canvas.getWidth()];
      const snapYCandidates = [0, canvas.getHeight() / 2, canvas.getHeight()];

      // トップレベルオブジェクトの端・中心を収集（移動中のオブジェクト自体は除外）
      canvas.getObjects().forEach((obj: any) => {
        if (obj === target) return;
        const r = obj.getBoundingRect(true);
        snapXCandidates.push(r.left, r.left + r.width / 2, r.left + r.width);
        snapYCandidates.push(r.top, r.top + r.height / 2, r.top + r.height);
      });

      // 移動中オブジェクトの左端・中心・右端それぞれでスナップ判定
      const tEdgesX = [bound.left, tCenterX, bound.left + bound.width];
      const tEdgesY = [bound.top, tCenterY, bound.top + bound.height];

      let bestDx: number | null = null;
      let bestDistX = SNAP_THRESHOLD;
      let bestSnapX: number | null = null;
      for (const edge of tEdgesX) {
        for (const snap of snapXCandidates) {
          const dist = Math.abs(edge - snap);
          if (dist < bestDistX) {
            bestDistX = dist;
            bestDx = snap - edge;
            bestSnapX = snap;
          }
        }
      }

      let bestDy: number | null = null;
      let bestDistY = SNAP_THRESHOLD;
      let bestSnapY: number | null = null;
      for (const edge of tEdgesY) {
        for (const snap of snapYCandidates) {
          const dist = Math.abs(edge - snap);
          if (dist < bestDistY) {
            bestDistY = dist;
            bestDy = snap - edge;
            bestSnapY = snap;
          }
        }
      }

      return { dx: bestDx, dy: bestDy, snapX: bestSnapX, snapY: bestSnapY };
    }

    /** ドラッグ中: ガイドラインのプレビューのみ（位置は変更しない） */
    canvas.on('object:moving', (e: { target: any }) => {
      if (!$snapEnabled) {
        snapGuides = { x: null, y: null };
        return;
      }
      const target = e.target;
      if (!target) return;

      const { snapX, snapY } = findSnapCandidates(target);
      snapGuides = { x: snapX, y: snapY };
    });

    /** ドラッグ終了時: 実際の吸着確定を1回だけ実行 */
    function commitSnapOnDragEnd(target: any) {
      if (!$snapEnabled || !target) return;

      const { dx, dy } = findSnapCandidates(target);
      if (dx !== null) target.set('left', target.left + dx);
      if (dy !== null) target.set('top', target.top + dy);
      if (dx !== null || dy !== null) {
        target.setCoords();
        canvas.renderAll();
      }

      // ガイドをクリア
      snapGuides = { x: null, y: null };
    }

    // Save state on object modifications for undo/redo
    canvas.on('object:added', () => { showWelcome = false; saveState(); });
    canvas.on('object:modified', (e: { target: any }) => {
      commitSnapOnDragEnd(e.target);
      saveState();
    });
    canvas.on('object:removed', () => saveState());

    // ドラッグ終了時にガイドをクリア
    canvas.on('mouse:up', () => {
      snapGuides = { x: null, y: null };
    });

    // Save initial empty state
    saveState();

    // Keyboard shortcuts & click-outside to close context menu
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', hideContextMenu);

    dispatch('ready');
  });

  onDestroy(() => {
    unsubscribe();
    if (propSaveTimer) clearTimeout(propSaveTimer);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('click', hideContextMenu);
    canvas?.dispose();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function syncStateFromObject(obj: any) {
    isSyncingFromObject = true;

    // For groups/activeSelections, read fill/stroke from the first visible child
    if (obj.type === 'group' || obj.type === 'activeSelection') {
      let childFill = '';
      let childStroke = '';
      let childStrokeWidth = 0;
      if (obj._objects) {
        for (const child of obj._objects) {
          if (!childFill && child.fill && child.fill !== 'none' && child.fill !== '') {
            childFill = child.fill;
          }
          if (!childStroke && child.stroke && child.stroke !== 'none' && child.stroke !== '') {
            childStroke = child.stroke;
          }
          if (!childStrokeWidth && child.strokeWidth) {
            childStrokeWidth = child.strokeWidth;
          }
          if (childFill || childStroke) break;
        }
      }
      editorState.update((s) => ({
        ...s,
        fillColor: childFill || s.fillColor,
        strokeColor: childStroke || s.strokeColor,
        strokeWidth: childStrokeWidth || s.strokeWidth,
        opacity: Math.round((obj.opacity ?? 1) * 100)
      }));
    } else {
      editorState.update((s) => ({
        ...s,
        fillColor: obj.fill ?? s.fillColor,
        strokeColor: obj.stroke ?? s.strokeColor,
        strokeWidth: obj.strokeWidth ?? s.strokeWidth,
        borderRadius: obj.rx ?? s.borderRadius,
        opacity: Math.round((obj.opacity ?? 1) * 100),
        fontFamily: obj.fontFamily ?? s.fontFamily
      }));
    }

    // Keep guard active through the next microtask so that
    // setSelectedObjectId (called right after) doesn't trigger store → canvas writeback
    Promise.resolve().then(() => {
      isSyncingFromObject = false;
    });
  }

  /** Exit child-edit mode: re-group scattered children back into a single group */
  function exitChildEditMode() {
    if (!childEditObjects || !canvas || !fabricModule) return;
    const { fabric } = fabricModule;

    isBatchOperation = true;

    // Exit any active text editing first
    const active = canvas.getActiveObject();
    if (active && active.isEditing) {
      active.exitEditing();
    }
    canvas.discardActiveObject();

    // Filter out any children that may have been deleted during editing
    const surviving = childEditObjects.filter((obj: any) => canvas.getObjects().includes(obj));

    if (surviving.length > 0) {
      // Remove children from canvas and create a new group
      const group = new fabric.Group(surviving, { });
      surviving.forEach((obj: any) => canvas.remove(obj));
      (group as { __id?: string }).__id = `group_${Date.now()}`;
      canvas.add(group);
      canvas.setActiveObject(group);
    }

    childEditObjects = null;
    canvas.renderAll();
    isBatchOperation = false;
    saveState();
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
      fontFamily: $editorState.fontFamily,
      fill: $editorState.fillColor,
      fontWeight: '700'
    });
    (text as { __id?: string }).__id = `text_${Date.now()}`;
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  export function addLine() {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const state = $editorState;
    const line = new fabric.Line([80, 200, 400, 200], {
      stroke: state.strokeColor,
      strokeWidth: Math.max(state.strokeWidth, 2),
      fill: '',
      strokeLineCap: 'round'
    });
    (line as { __id?: string }).__id = `line_${Date.now()}`;
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
  }

  export function addBezier() {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const state = $editorState;
    // Cubic bezier: M start C control1 control2 end
    const path = new fabric.Path('M 60 300 C 140 100, 360 100, 440 300', {
      stroke: state.strokeColor,
      strokeWidth: Math.max(state.strokeWidth, 2),
      fill: '',
      strokeLineCap: 'round'
    });
    (path as { __id?: string }).__id = `bezier_${Date.now()}`;
    canvas.add(path);
    canvas.setActiveObject(path);
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

  /** シルエットSVGをキャンバスに配置（パーツと同じ方式） */
  export async function loadSilhouette(sil: CatSilhouette) {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;

    try {
      await new Promise<void>((resolve, reject) => {
        fabric.loadSVGFromURL(
          `${base}${sil.svgFile}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (objects: any[], options: any) => {
            if (!objects || objects.length === 0) {
              reject(new Error('Silhouette SVG load failed'));
              return;
            }

            const group = fabric.util.groupSVGElements(objects, options);
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
            (group as { __id?: string }).__id = `sil_${sil.id}_${Date.now()}`;
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.renderAll();
            resolve();
          }
        );
      });
    } catch (e) {
      console.error('Failed to load silhouette SVG:', e);
    }
  }

  /** 用途別UIプリセットをキャンバスへ追加 */
  export async function createPreset(preset: UIPreset) {
    if (!canvas || !fabricModule) return;
    const { fabric } = fabricModule;
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();

    isBatchOperation = true;

    for (const elem of preset.elements) {
      // テキスト要素（svgFile が空の場合）
      if (!elem.svgFile) {
        const label = elem.idPrefix.replace('preset-text:', '');
        const text = new fabric.IText(label, {
          left: canvasW * elem.xRatio,
          top: canvasH * elem.yRatio,
          fontSize: 24,
          fontFamily: $editorState.fontFamily,
          fill: '#FFB7C5',
          fontWeight: '700'
        });
        (text as { __id?: string }).__id = `preset_text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        canvas.add(text);
        continue;
      }

      // SVG要素
      await new Promise<void>((resolve) => {
        fabric.loadSVGFromURL(
          `${base}${elem.svgFile}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (objects: any[], options: any) => {
            if (!objects || objects.length === 0) {
              resolve();
              return;
            }
            const group = fabric.util.groupSVGElements(objects, options);
            const scale = (canvasW * elem.scaleRatio) / (group.width ?? 100);
            group.set({
              left: canvasW * elem.xRatio,
              top: canvasH * elem.yRatio,
              scaleX: scale,
              scaleY: scale,
              angle: elem.angle ?? 0
            });
            (group as { __id?: string }).__id = `${elem.idPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            canvas.add(group);
            resolve();
          }
        );
      });
    }

    canvas.discardActiveObject();
    canvas.renderAll();
    isBatchOperation = false;
    saveState();
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

  // X軸・Y軸反転
  export function flipX() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set('flipX', !active.flipX);
    canvas.renderAll();
    saveState();
  }

  export function flipY() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.set('flipY', !active.flipY);
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

  /** Remove only the random-generated objects from canvas (manual objects untouched) */
  function removeRandomObjects() {
    if (!canvas || randomObjectIds.length === 0) return;
    const idSet = new Set(randomObjectIds);
    const objs = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objs.filter((o: any) => idSet.has((o as { __id?: string }).__id ?? ''));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    randomObjectIds = [];
  }

  /** Place a RandomResult onto canvas, returning the IDs of newly added objects */
  async function placeRandomLayout(result: RandomResult): Promise<string[]> {
    if (!canvas || !fabricModule) return [];
    const { fabric } = fabricModule;
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();

    const newIds: string[] = [];

    for (const placed of result.parts) {
      await new Promise<void>((resolve) => {
        fabric.loadSVGFromURL(
          `${base}${placed.svgFile}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (objects: any[], options: any) => {
            if (!objects || objects.length === 0) { resolve(); return; }

            const group = fabric.util.groupSVGElements(objects, options);
            const scale = (canvasW * placed.scale) / (group.width ?? 100);

            group.set({
              left: canvasW * placed.x,
              top: canvasH * placed.y,
              scaleX: scale,
              scaleY: scale
            });

            // Apply theme colours to children
            if (group._objects) {
              for (const child of group._objects) {
                if (child.fill && child.fill !== 'none' && child.fill !== '') {
                  child.set({ fill: result.theme.fill });
                }
                if (child.stroke && child.stroke !== 'none' && child.stroke !== '') {
                  child.set({ stroke: result.theme.stroke });
                }
              }
            } else {
              if (group.fill && group.fill !== 'none') group.set({ fill: result.theme.fill });
              if (group.stroke && group.stroke !== 'none') group.set({ stroke: result.theme.stroke });
            }

            const id = `random_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            (group as { __id?: string }).__id = id;
            newIds.push(id);
            canvas.add(group);
            resolve();
          }
        );
      });
    }

    return newIds;
  }

  /**
   * ランダム猫UI（新規生成）
   * - 既存オブジェクト（手動配置・以前の生成物すべて）を残す
   * - 新しいランダムUIを追加し、randomObjectIds を上書き
   *   （シャッフル対象は常に「直近の生成グループ」のみ）
   */
  export async function generateRandomCatUI() {
    if (!canvas || !fabricModule) return;

    isBatchOperation = true;
    showWelcome = false;

    const result = generateRandomLayout();
    canvas.backgroundColor = result.theme.bg;
    const newIds = await placeRandomLayout(result);

    // Track the newly generated group (previous random objects become "manual" — no longer shuffleable)
    randomObjectIds = newIds;
    lastRandomThemeId = result.themeId;

    canvas.discardActiveObject();
    canvas.renderAll();
    isBatchOperation = false;
    saveState();
  }

  /**
   * シャッフル（再生成）
   * - 直前に生成された randomObjectIds のオブジェクトだけ削除
   * - 同じテーマで再生成し、randomObjectIds を更新
   * - 手動配置オブジェクトは一切触らない
   */
  export async function shuffleCatUI() {
    if (!canvas || !fabricModule) return;
    // シャッフル対象がなければ新規生成にフォールバック
    if (randomObjectIds.length === 0) {
      return generateRandomCatUI();
    }

    isBatchOperation = true;

    // Remove only the last random-generated group
    removeRandomObjects();

    // Re-generate with same theme
    const result = generateRandomLayout(lastRandomThemeId ?? undefined);
    canvas.backgroundColor = result.theme.bg;
    const newIds = await placeRandomLayout(result);

    randomObjectIds = newIds;
    lastRandomThemeId = result.themeId;

    canvas.discardActiveObject();
    canvas.renderAll();
    isBatchOperation = false;
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
  <div class="shadow-2xl shadow-black/60 rounded-lg overflow-hidden border border-white/10 relative">
    <canvas bind:this={canvasEl}></canvas>
    {#if $gridEnabled}
      <div
        class="absolute inset-0 pointer-events-none"
        style="
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: {GRID_SIZE}px {GRID_SIZE}px;
        "
      ></div>
    {/if}
    <!-- スナップガイドライン（ドラッグ中のプレビュー） -->
    {#if snapGuides.x !== null}
      <div
        class="absolute top-0 bottom-0 pointer-events-none"
        style="left: {snapGuides.x}px; width: 1px; background: rgba(255,107,181,0.5);"
      ></div>
    {/if}
    {#if snapGuides.y !== null}
      <div
        class="absolute left-0 right-0 pointer-events-none"
        style="top: {snapGuides.y}px; height: 1px; background: rgba(255,107,181,0.5);"
      ></div>
    {/if}
  </div>

  <!-- Welcome showcase overlay -->
  {#if showWelcome}
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-[#111827]/80 z-40 backdrop-blur-sm">
      <p class="text-white/70 text-lg font-bold mb-1">{$t.welcomeTitle}</p>
      <p class="text-white/40 text-sm mb-5">{$t.welcomeSub}</p>
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
                alt={$t[`tpl.${template.id}`] ?? template.id}
                class="max-h-full max-w-full object-contain"
              />
            </div>
            <p class="text-white/70 text-[10px] font-semibold text-center py-1 px-1 truncate">{$t[`tpl.${template.id}`] ?? template.id}</p>
          </button>
        {/each}
      </div>
      <button
        class="mt-5 text-white/30 text-xs hover:text-white/60 transition-colors"
        on:click={() => { showWelcome = false; }}
      >
        {$t.welcomeSkip}
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
          <span>{$t.delete}</span><span class="ctx-shortcut">Delete</span>
        </button>
        <hr class="border-white/10" />
        <button class="ctx-item" on:click={() => ctxAction(bringToFront)}>
          <span>{$t.bringToFront}</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(bringForward)}>
          <span>{$t.bringForward}</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(sendBackwards)}>
          <span>{$t.sendBackwards}</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(sendToBack)}>
          <span>{$t.sendToBack}</span>
        </button>
        <hr class="border-white/10" />
        <button class="ctx-item" on:click={() => ctxAction(groupSelected)}>
          <span>{$t.group}</span><span class="ctx-shortcut">Ctrl+G</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(ungroupSelected)}>
          <span>{$t.ungroup}</span><span class="ctx-shortcut">Ctrl+Shift+G</span>
        </button>
      {:else}
        <button class="ctx-item" on:click={() => ctxAction(undo)}>
          <span>{$t.undo}</span><span class="ctx-shortcut">Ctrl+Z</span>
        </button>
        <button class="ctx-item" on:click={() => ctxAction(redo)}>
          <span>{$t.redo}</span><span class="ctx-shortcut">Ctrl+Shift+Z</span>
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
