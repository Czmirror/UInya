<!-- Presents editor actions and dispatches them to the page that owns the canvas. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { editorState, gridEnabled, snapEnabled } from '$lib/stores/editorStore';
  import { t } from '$lib/stores/i18n';

  const dispatch = createEventDispatcher<{
    addRect: void;
    addRoundedRect: void;
    addText: void;
    addCircle: void;
    addLine: void;
    addBezier: void;
    deleteSelected: void;
    clearAll: void;
    undo: void;
    redo: void;
    groupSelected: void;
    ungroupSelected: void;
    bringToFront: void;
    bringForward: void;
    sendBackwards: void;
    sendToBack: void;
    flipX: void;
    flipY: void;
    randomCatUI: void;
    shuffleCatUI: void;
    saveCanvas: void;
    loadCanvas: void;
    clearSave: void;
  }>();

  $: hasSelection = $editorState.selectedObjectId !== null;

  // Toast notification for save/load feedback
  let toastMessage = '';
  let toastVisible = false;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  export function showToast(msg: string) {
    toastMessage = msg;
    toastVisible = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastVisible = false; }, 2000);
  }
</script>

<div class="flex flex-wrap shrink-0 items-center gap-x-1 gap-y-2 px-3 py-2 bg-editor-panel border-b border-editor-line">
  <!-- 図形追加ツール -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <span class="text-editor-muted text-xs mr-1 whitespace-nowrap">{$t.add}</span>
    <button
      aria-label={$t.addRect}
      class="tool-btn"
      on:click={() => dispatch('addRect')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="1"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.addRect}</span>
    </button>
    <button
      aria-label={$t.addRoundedRect}
      class="tool-btn"
      on:click={() => dispatch('addRoundedRect')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="5"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.addRoundedRect}</span>
    </button>
    <button
      aria-label={$t.addCircle}
      class="tool-btn"
      on:click={() => dispatch('addCircle')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.addCircle}</span>
    </button>
    <button
      aria-label={$t.addText}
      class="tool-btn"
      on:click={() => dispatch('addText')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.addText}</span>
    </button>
    <button
      aria-label={$t.addLine}
      class="tool-btn"
      on:click={() => dispatch('addLine')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="19" x2="19" y2="5"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.addLine}</span>
    </button>
    <button
      aria-label={$t.addBezier}
      class="tool-btn"
      on:click={() => dispatch('addBezier')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 18 C 8 6, 16 6, 20 18" stroke-linecap="round"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.addBezier}</span>
    </button>
  </div>

  <!-- 編集ツール -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.undo}
      class="tool-btn"
      on:click={() => dispatch('undo')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v6h6"/>
        <path d="M3 13A9 9 0 1 0 6 6.3L3 9"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.undo} (Ctrl+Z)</span>
    </button>
    <button
      aria-label={$t.redo}
      class="tool-btn"
      on:click={() => dispatch('redo')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 7v6h-6"/>
        <path d="M21 13A9 9 0 1 1 18 6.3L21 9"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.redo} (Ctrl+Shift+Z)</span>
    </button>
  </div>

  <!-- グループ -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.group}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('groupSelected')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="2" width="8" height="8" rx="1"/>
        <rect x="14" y="14" width="8" height="8" rx="1"/>
        <path d="M10 6h4M6 10v4M14 18h-4M18 14v-4" stroke-dasharray="2 2"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.group} (Ctrl+G)</span>
    </button>
    <button
      aria-label={$t.ungroup}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('ungroupSelected')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="2" width="8" height="8" rx="1"/>
        <rect x="14" y="14" width="8" height="8" rx="1"/>
        <path d="M12 8l2-2M12 16l-2 2" stroke-linecap="round"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.ungroup} (Ctrl+Shift+G)</span>
    </button>
  </div>

  <!-- レイヤー順序 -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.bringToFront}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('bringToFront')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="8" y="2" width="13" height="13" rx="1"/>
        <rect x="3" y="9" width="13" height="13" rx="1" fill="currentColor" opacity="0.15"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.bringToFront}</span>
    </button>
    <button
      aria-label={$t.bringForward}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('bringForward')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5l-4 4h8l-4-4z" fill="currentColor" opacity="0.3"/>
        <rect x="4" y="12" width="16" height="2" rx="1"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.bringForward}</span>
    </button>
    <button
      aria-label={$t.sendBackwards}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('sendBackwards')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 19l-4-4h8l-4 4z" fill="currentColor" opacity="0.3"/>
        <rect x="4" y="10" width="16" height="2" rx="1"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.sendBackwards}</span>
    </button>
    <button
      aria-label={$t.sendToBack}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('sendToBack')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="2" width="13" height="13" rx="1"/>
        <rect x="8" y="9" width="13" height="13" rx="1" fill="currentColor" opacity="0.15"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.sendToBack}</span>
    </button>
  </div>

  <!-- 反転 -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.flipX}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('flipX')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3v18" stroke-dasharray="2 2"/>
        <path d="M16 7h4v10h-4" /><path d="M8 7H4v10h4" />
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.flipX}</span>
    </button>
    <button
      aria-label={$t.flipY}
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('flipY')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18" stroke-dasharray="2 2"/>
        <path d="M7 8V4h10v4" /><path d="M7 16v4h10v-4" />
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.flipY}</span>
    </button>
  </div>

  <!-- グリッド・スナップ -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.grid}
      class="tool-btn {$gridEnabled ? 'text-editor-focus bg-cat-pink/15' : ''}"
      on:click={() => gridEnabled.update(v => !v)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.grid} {$gridEnabled ? 'OFF' : 'ON'}</span>
    </button>
    <button
      aria-label={$t.snap}
      class="tool-btn {$snapEnabled ? 'text-editor-muted bg-cat-peach/15' : ''}"
      on:click={() => snapEnabled.update(v => !v)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 12h4M16 12h4M12 4v4M12 16v4"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
      <span class="tooltip" aria-hidden="true">{$t.snap} {$snapEnabled ? 'OFF' : 'ON'}</span>
    </button>
  </div>

  <!-- ランダム猫UI生成 -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.randomCatUI}
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap
        bg-cat-pink/15 text-editor-focus hover:bg-cat-pink/25 transition-colors relative"
      on:click={() => dispatch('randomCatUI')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="2" width="20" height="20" rx="4"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
      <span class="inline">{$t.randomCatUI}</span>
      <span class="tooltip" aria-hidden="true">{$t.randomCatUI}</span>
    </button>
    <button
      aria-label={$t.shuffleCatUI}
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap
        bg-cat-peach/15 text-editor-muted hover:bg-cat-peach/25 transition-colors relative"
      on:click={() => dispatch('shuffleCatUI')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="inline">{$t.shuffleCatUI}</span>
      <span class="tooltip" aria-hidden="true">{$t.shuffleCatUI}</span>
    </button>
  </div>

  <!-- 保存 / 読み込み / 保存削除 -->
  <div class="flex items-center gap-1 shrink-0 border-r border-editor-line pr-2">
    <button
      aria-label={$t.saveCanvas}
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap
        bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 transition-colors relative"
      on:click={() => dispatch('saveCanvas')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      <span class="inline">{$t.saveCanvas}</span>
      <span class="tooltip" aria-hidden="true">{$t.saveCanvas}</span>
    </button>
    <button
      aria-label={$t.loadCanvas}
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap
        bg-sky-500/15 text-sky-800 hover:bg-sky-500/25 transition-colors relative"
      on:click={() => dispatch('loadCanvas')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span class="inline">{$t.loadCanvas}</span>
      <span class="tooltip" aria-hidden="true">{$t.loadCanvas}</span>
    </button>
    <button
      aria-label={$t.clearSave}
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap
        bg-orange-500/15 text-orange-900 hover:bg-orange-500/25 transition-colors relative"
      on:click={() => dispatch('clearSave')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
      <span class="inline">{$t.clearSave}</span>
      <span class="tooltip" aria-hidden="true">{$t.clearSave}</span>
    </button>
  </div>

  <!-- 削除 -->
  <button
      aria-label={$t.deleteSelected}
    class="tool-btn {hasSelection ? 'text-red-800 hover:bg-red-400/20' : 'opacity-40 cursor-not-allowed'}"
    disabled={!hasSelection}
    on:click={() => dispatch('deleteSelected')}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
    <span class="tooltip" aria-hidden="true">{$t.deleteSelected} (Delete)</span>
  </button>

  <button
      aria-label={$t.clearAll}
    class="tool-btn text-editor-muted hover:text-red-800"
    on:click={() => dispatch('clearAll')}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3l18 18M9 9l-1 13h8l-1-13"/>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
    </svg>
    <span class="tooltip" aria-hidden="true">{$t.clearAll}</span>
  </button>

  <!-- Toast notification -->
  {#if toastVisible}
    <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[100]
      px-4 py-2 rounded-lg bg-editor-panel border border-editor-line shadow-xl
      text-sm text-editor-ink font-bold animate-fade-in">
      {toastMessage}
    </div>
  {/if}
</div>

<style>
  .tool-btn {
    @apply p-1.5 rounded-lg text-editor-muted hover:text-editor-ink hover:bg-editor-card transition-colors relative;
  }
  .tooltip {
    @apply invisible absolute left-1/2 -translate-x-1/2 top-full mt-2
      px-2 py-1 rounded text-xs whitespace-nowrap z-50
      bg-editor-ink text-editor-paper pointer-events-none;
  }
  .tool-btn:hover .tooltip,
  .tool-btn:focus-visible .tooltip {
    @apply visible;
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translate(-50%, -8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  :global(.animate-fade-in) {
    animation: fade-in 0.2s ease-out;
  }
</style>
