<script lang="ts">
  import { exportOptions } from '$lib/stores/editorStore';

  export let onExportSvg: () => void;
  export let onExportPng: () => void;

  $: opts = $exportOptions;
</script>

<div class="flex items-center gap-3">
  <!-- サイズ -->
  <div class="flex items-center gap-1 text-xs text-white/50">
    <span>W:</span>
    <input
      type="number"
      min="64"
      max="4096"
      step="64"
      value={opts.width}
      class="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cat-pink/60"
      on:change={(e) => exportOptions.update(o => ({ ...o, width: Number(e.currentTarget.value) }))}
    />
    <span>H:</span>
    <input
      type="number"
      min="64"
      max="4096"
      step="64"
      value={opts.height}
      class="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cat-pink/60"
      on:change={(e) => exportOptions.update(o => ({ ...o, height: Number(e.currentTarget.value) }))}
    />
  </div>

  <!-- 透過PNG オプション -->
  <label class="flex items-center gap-1 text-xs text-white/60 cursor-pointer">
    <input
      type="checkbox"
      checked={opts.transparent}
      on:change={(e) => exportOptions.update(o => ({ ...o, transparent: e.currentTarget.checked }))}
    />
    透過PNG
  </label>

  <!-- エクスポートボタン -->
  <button
    class="px-5 py-2 bg-cat-pink text-dark-bg rounded-lg text-sm font-bold
      hover:bg-cat-pink/80 transition-colors shadow-md shadow-cat-pink/20 flex items-center gap-1.5"
    on:click={onExportSvg}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-4-4m4 4l4-4M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
    SVG
  </button>
  <button
    class="px-5 py-2 bg-cat-lavender text-dark-bg rounded-lg text-sm font-bold
      hover:bg-cat-lavender/80 transition-colors shadow-md shadow-cat-lavender/20 flex items-center gap-1.5"
    on:click={onExportPng}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-4-4m4 4l4-4M4 19h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
    PNG
  </button>
</div>
