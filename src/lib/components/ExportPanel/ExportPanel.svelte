<!-- Presents localized export options and calls the page download actions. -->
<script lang="ts">
  import { exportOptions } from '$lib/stores/editorStore';
  import { isExportSize, MIN_EXPORT_SIZE, MAX_EXPORT_SIZE } from '$lib/types/exportDimensions';
  import { t } from '$lib/stores/i18n';

  export let onExportSvg: () => void;
  export let onExportPng: () => void;

  $: opts = $exportOptions;
  $: invalidWidth = !isExportSize(opts.width);
  $: invalidHeight = !isExportSize(opts.height);
</script>

<div class="contents sm:flex sm:flex-wrap sm:items-center sm:gap-3">
  <!-- サイズ -->
  <div class="flex items-center gap-1 text-xs text-editor-muted">
    <span>W:</span>
    <input
      type="number"
      min={MIN_EXPORT_SIZE}
      max={MAX_EXPORT_SIZE}
      step="1"
      aria-label={$t.exportWidth}
      aria-invalid={invalidWidth}
      aria-describedby={invalidWidth ? 'export-size-error' : undefined}
      value={Number.isFinite(opts.width) ? opts.width : ''}
      class="w-16 bg-editor-paper border border-editor-line rounded px-2 py-1 text-editor-ink text-xs focus:outline-none focus:border-editor-focus/60"
      on:input={(e) => exportOptions.update(o => ({ ...o, width: e.currentTarget.valueAsNumber }))}
    />
    <span>H:</span>
    <input
      type="number"
      min={MIN_EXPORT_SIZE}
      max={MAX_EXPORT_SIZE}
      step="1"
      aria-label={$t.exportHeight}
      aria-invalid={invalidHeight}
      aria-describedby={invalidHeight ? 'export-size-error' : undefined}
      value={Number.isFinite(opts.height) ? opts.height : ''}
      class="w-16 bg-editor-paper border border-editor-line rounded px-2 py-1 text-editor-ink text-xs focus:outline-none focus:border-editor-focus/60"
      on:input={(e) => exportOptions.update(o => ({ ...o, height: e.currentTarget.valueAsNumber }))}
    />
  </div>

  {#if invalidWidth || invalidHeight}
    <p id="export-size-error" role="status" class="text-xs font-semibold text-red-800">
      {$t.exportSizeError.replace('{min}', String(MIN_EXPORT_SIZE)).replace('{max}', String(MAX_EXPORT_SIZE))}
    </p>
  {/if}

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
      disabled={invalidWidth || invalidHeight}
      class:opacity-50={invalidWidth || invalidHeight}
      on:click={onExportSvg}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-4-4m4 4l4-4M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      SVG
    </button>
    <button
      class="px-3 py-2 sm:px-5 bg-cat-peach text-editor-ink rounded-lg text-sm font-bold
        hover:bg-cat-peach/80 transition-colors shadow-md shadow-cat-peach/20 flex items-center gap-1.5"
      disabled={invalidWidth || invalidHeight}
      class:opacity-50={invalidWidth || invalidHeight}
      on:click={onExportPng}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-4-4m4 4l4-4M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      PNG
    </button>
  </div>
</div>
