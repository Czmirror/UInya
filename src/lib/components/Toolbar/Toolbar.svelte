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
  }>();

  $: hasSelection = $editorState.selectedObjectId !== null;
</script>

<div class="flex items-center gap-1 px-4 py-2 bg-dark-panel border-b border-white/10">
  <!-- 図形追加ツール -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <span class="text-white/40 text-xs mr-1">{$t.add}</span>
    <button
      class="tool-btn"
      on:click={() => dispatch('addRect')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="1"/>
      </svg>
      <span class="tooltip">{$t.addRect}</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addRoundedRect')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="5"/>
      </svg>
      <span class="tooltip">{$t.addRoundedRect}</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addCircle')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
      </svg>
      <span class="tooltip">{$t.addCircle}</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addText')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
      </svg>
      <span class="tooltip">{$t.addText}</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addLine')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="19" x2="19" y2="5"/>
      </svg>
      <span class="tooltip">{$t.addLine}</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addBezier')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 18 C 8 6, 16 6, 20 18" stroke-linecap="round"/>
      </svg>
      <span class="tooltip">{$t.addBezier}</span>
    </button>
  </div>

  <!-- 編集ツール -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <button
      class="tool-btn"
      on:click={() => dispatch('undo')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v6h6"/>
        <path d="M3 13A9 9 0 1 0 6 6.3L3 9"/>
      </svg>
      <span class="tooltip">{$t.undo} (Ctrl+Z)</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('redo')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 7v6h-6"/>
        <path d="M21 13A9 9 0 1 1 18 6.3L21 9"/>
      </svg>
      <span class="tooltip">{$t.redo} (Ctrl+Shift+Z)</span>
    </button>
  </div>

  <!-- グループ -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('groupSelected')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="2" width="8" height="8" rx="1"/>
        <rect x="14" y="14" width="8" height="8" rx="1"/>
        <path d="M10 6h4M6 10v4M14 18h-4M18 14v-4" stroke-dasharray="2 2"/>
      </svg>
      <span class="tooltip">{$t.group} (Ctrl+G)</span>
    </button>
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('ungroupSelected')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="2" width="8" height="8" rx="1"/>
        <rect x="14" y="14" width="8" height="8" rx="1"/>
        <path d="M12 8l2-2M12 16l-2 2" stroke-linecap="round"/>
      </svg>
      <span class="tooltip">{$t.ungroup} (Ctrl+Shift+G)</span>
    </button>
  </div>

  <!-- レイヤー順序 -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('bringToFront')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="8" y="2" width="13" height="13" rx="1"/>
        <rect x="3" y="9" width="13" height="13" rx="1" fill="currentColor" opacity="0.15"/>
      </svg>
      <span class="tooltip">{$t.bringToFront}</span>
    </button>
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('bringForward')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5l-4 4h8l-4-4z" fill="currentColor" opacity="0.3"/>
        <rect x="4" y="12" width="16" height="2" rx="1"/>
      </svg>
      <span class="tooltip">{$t.bringForward}</span>
    </button>
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('sendBackwards')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 19l-4-4h8l-4 4z" fill="currentColor" opacity="0.3"/>
        <rect x="4" y="10" width="16" height="2" rx="1"/>
      </svg>
      <span class="tooltip">{$t.sendBackwards}</span>
    </button>
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('sendToBack')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="2" width="13" height="13" rx="1"/>
        <rect x="8" y="9" width="13" height="13" rx="1" fill="currentColor" opacity="0.15"/>
      </svg>
      <span class="tooltip">{$t.sendToBack}</span>
    </button>
  </div>

  <!-- 反転 -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('flipX')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3v18" stroke-dasharray="2 2"/>
        <path d="M16 7h4v10h-4" /><path d="M8 7H4v10h4" />
      </svg>
      <span class="tooltip">{$t.flipX}</span>
    </button>
    <button
      class="tool-btn {hasSelection ? '' : 'opacity-40 cursor-not-allowed'}"
      disabled={!hasSelection}
      on:click={() => dispatch('flipY')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12h18" stroke-dasharray="2 2"/>
        <path d="M7 8V4h10v4" /><path d="M7 16v4h10v-4" />
      </svg>
      <span class="tooltip">{$t.flipY}</span>
    </button>
  </div>

  <!-- グリッド・スナップ -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <button
      class="tool-btn {$gridEnabled ? 'text-cat-pink bg-cat-pink/15' : ''}"
      on:click={() => gridEnabled.update(v => !v)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
      </svg>
      <span class="tooltip">{$t.grid} {$gridEnabled ? 'OFF' : 'ON'}</span>
    </button>
    <button
      class="tool-btn {$snapEnabled ? 'text-cat-lavender bg-cat-lavender/15' : ''}"
      on:click={() => snapEnabled.update(v => !v)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 12h4M16 12h4M12 4v4M12 16v4"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
      <span class="tooltip">{$t.snap} {$snapEnabled ? 'OFF' : 'ON'}</span>
    </button>
  </div>

  <!-- ランダム猫UI生成 -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <button
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
        bg-cat-pink/15 text-cat-pink hover:bg-cat-pink/25 transition-colors relative"
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
      <span class="hidden sm:inline">{$t.randomCatUI}</span>
      <span class="tooltip">{$t.randomCatUI}</span>
    </button>
    <button
      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
        bg-cat-lavender/15 text-cat-lavender hover:bg-cat-lavender/25 transition-colors relative"
      on:click={() => dispatch('shuffleCatUI')}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="hidden sm:inline">{$t.shuffleCatUI}</span>
      <span class="tooltip">{$t.shuffleCatUI}</span>
    </button>
  </div>

  <!-- 削除 -->
  <button
    class="tool-btn {hasSelection ? 'text-red-400 hover:bg-red-400/20' : 'opacity-40 cursor-not-allowed'}"
    disabled={!hasSelection}
    on:click={() => dispatch('deleteSelected')}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
    <span class="tooltip">{$t.deleteSelected} (Delete)</span>
  </button>

  <button
    class="tool-btn text-white/50 hover:text-red-400"
    on:click={() => dispatch('clearAll')}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3l18 18M9 9l-1 13h8l-1-13"/>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
    </svg>
    <span class="tooltip">{$t.clearAll}</span>
  </button>
</div>

<style>
  .tool-btn {
    @apply p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors relative;
  }
  .tooltip {
    @apply invisible absolute left-1/2 -translate-x-1/2 top-full mt-2
      px-2 py-1 rounded text-xs whitespace-nowrap z-50
      bg-black/90 text-white pointer-events-none;
  }
  .tool-btn:hover .tooltip {
    @apply visible;
  }
</style>
