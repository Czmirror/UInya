<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { editorState } from '$lib/stores/editorStore';

  const dispatch = createEventDispatcher<{
    addRect: void;
    addRoundedRect: void;
    addText: void;
    addCircle: void;
    deleteSelected: void;
    clearAll: void;
    undo: void;
    redo: void;
    groupSelected: void;
    ungroupSelected: void;
  }>();

  $: hasSelection = $editorState.selectedObjectId !== null;
</script>

<div class="flex items-center gap-1 px-4 py-2 bg-dark-panel border-b border-white/10">
  <!-- 図形追加ツール -->
  <div class="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
    <span class="text-white/40 text-xs mr-1">追加:</span>
    <button
      class="tool-btn"
      on:click={() => dispatch('addRect')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="1"/>
      </svg>
      <span class="tooltip">矩形を追加</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addRoundedRect')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="5"/>
      </svg>
      <span class="tooltip">角丸矩形を追加</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addCircle')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
      </svg>
      <span class="tooltip">円を追加</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('addText')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
      </svg>
      <span class="tooltip">テキストを追加</span>
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
      <span class="tooltip">元に戻す (Ctrl+Z)</span>
    </button>
    <button
      class="tool-btn"
      on:click={() => dispatch('redo')}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 7v6h-6"/>
        <path d="M21 13A9 9 0 1 1 18 6.3L21 9"/>
      </svg>
      <span class="tooltip">やり直す (Ctrl+Shift+Z)</span>
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
      <span class="tooltip">グループ化 (Ctrl+G)</span>
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
      <span class="tooltip">グループ解除 (Ctrl+Shift+G)</span>
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
    <span class="tooltip">選択を削除 (Delete)</span>
  </button>

  <button
    class="tool-btn text-white/50 hover:text-red-400"
    on:click={() => dispatch('clearAll')}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3l18 18M9 9l-1 13h8l-1-13"/>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
    </svg>
    <span class="tooltip">全消去</span>
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
