<!-- Presents localized export options and calls the page download actions. -->
<script lang="ts">
  import { exportOptions } from '$lib/stores/editorStore';
  import { t } from '$lib/stores/i18n';

  export let onExportSvg: () => void;
  export let onExportPng: () => void;

  $: opts = $exportOptions;
</script>

<div class="contents sm:flex sm:flex-wrap sm:items-center sm:gap-3">
  <!-- サイズ -->
  <div class="flex items-center gap-1 text-xs text-editor-muted">
    <span>W:</span>
    <input
      type="number"
      min="64"
      max="4096"
      step="64"
      value={opts.width}
      class="w-16 bg-editor-paper border border-editor-line rounded px-2 py-1 text-editor-ink text-xs focus:outline-none focus:border-editor-focus/60"
      on:change={(e) => exportOptions.update(o => ({ ...o, width: Number(e.currentTarget.value) }))}
    />
    <span>H:</span>
    <input
      type="number"
      min="64"
      max="4096"
      step="64"
      value={opts.height}
      class="w-16 bg-editor-paper border border-editor-line rounded px-2 py-1 text-editor-ink text-xs focus:outline-none focus:border-editor-focus/60"
      on:change={(e) => exportOptions.update(o => ({ ...o, height: Number(e.currentTarget.value) }))}
    />
  </div>

  <!-- 透過PNG オプション -->
  <label class="flex items-center gap-1 text-xs text-editor-muted cursor-pointer">
    <input
      type="checkbox"
      checked={opts.transparent}
      on:change={(e) => exportOptions.update(o => ({ ...o, transparent: e.currentTarget.checked }))}
    />
    {$t.transparentPng}
  </label>

  <!-- エクスポートボタン -->
  <div class="flex shrink-0 items-center gap-2 sm:gap-3">
    <button
      class="px-3 py-2 sm:px-5 bg-cat-pink text-editor-ink rounded-lg text-sm font-bold
        hover:bg-cat-pink/80 transition-colors shadow-md shadow-cat-pink/20 flex items-center gap-1.5"
      on:click={onExportSvg}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-4-4m4 4l4-4M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      SVG
    </button>
    <button
      class="px-3 py-2 sm:px-5 bg-cat-peach text-editor-ink rounded-lg text-sm font-bold
        hover:bg-cat-peach/80 transition-colors shadow-md shadow-cat-peach/20 flex items-center gap-1.5"
      on:click={onExportPng}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-4-4m4 4l4-4M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      PNG
    </button>
  </div>
</div>
