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
    class="px-4 py-1.5 bg-cat-pink/20 border border-cat-pink/40 text-cat-pink rounded-lg text-sm font-semibold
      hover:bg-cat-pink/30 transition-colors"
    on:click={onExportSvg}
  >
    SVG
  </button>
  <button
    class="px-4 py-1.5 bg-cat-lavender/20 border border-cat-lavender/40 text-cat-lavender rounded-lg text-sm font-semibold
      hover:bg-cat-lavender/30 transition-colors"
    on:click={onExportPng}
  >
    PNG
  </button>
</div>
