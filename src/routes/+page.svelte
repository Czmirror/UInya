<script lang="ts">
  import TemplatePanel from '$lib/components/TemplatePanel/TemplatePanel.svelte';
  import Toolbar from '$lib/components/Toolbar/Toolbar.svelte';
  import FabricCanvas from '$lib/components/Editor/FabricCanvas.svelte';
  import PropertiesPanel from '$lib/components/Editor/PropertiesPanel.svelte';
  import ExportPanel from '$lib/components/ExportPanel/ExportPanel.svelte';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import type { CatTemplate, CatPart } from '$lib/types/ui';
  import type { UIPreset } from '$lib/templates/presets';
  import type { CatSilhouette } from '$lib/templates/catSilhouettes';
  import { locale, initLocale, setLocale, t } from '$lib/stores/i18n';
  import type { Locale } from '$lib/stores/i18n';
  import HeaderLogo from '$lib/components/HeaderLogo.svelte';

  let fabricCanvas: FabricCanvas;

  onMount(() => {
    initLocale();
  });

  function toggleLocale() {
    const next: Locale = $locale === 'ja' ? 'en' : 'ja';
    setLocale(next);
  }

  function handleTemplateSelect(e: CustomEvent<CatTemplate>) {
    fabricCanvas?.loadTemplate(e.detail);
  }

  function handlePartSelect(e: CustomEvent<CatPart>) {
    fabricCanvas?.loadPart(e.detail);
  }

  function handlePresetSelect(e: CustomEvent<UIPreset>) {
    fabricCanvas?.createPreset(e.detail);
  }

  function handleSilhouetteSelect(e: CustomEvent<CatSilhouette>) {
    fabricCanvas?.loadSilhouette(e.detail);
  }

  function handleExportSvg() {
    if (!fabricCanvas) return;
    const svgStr = fabricCanvas.exportSvg();
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    downloadBlob(blob, 'uinya-export.svg');
  }

  function handleExportPng() {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.exportPng();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'uinya-export.png';
    link.click();
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
</script>

<div class="flex flex-col h-screen overflow-hidden bg-dark-bg font-rounded">
  <!-- ヘッダー -->
  <header class="flex items-center justify-between px-5 py-3 bg-dark-panel border-b border-white/10 shrink-0">
    <!-- Logo: change variant="catface" to try the new cat face logo -->
    <HeaderLogo variant="paw" />

    <div class="flex items-center gap-3">
      <!-- 言語切替 -->
      <button
        class="flex items-center gap-0.5 text-xs font-bold rounded-lg border border-white/20 overflow-hidden"
        on:click={toggleLocale}
      >
        <span class="px-2 py-1 transition-colors {$locale === 'ja' ? 'bg-cat-pink text-dark-bg' : 'text-white/40 hover:text-white/60'}">JA</span>
        <span class="px-2 py-1 transition-colors {$locale === 'en' ? 'bg-cat-pink text-dark-bg' : 'text-white/40 hover:text-white/60'}">EN</span>
      </button>

      <!-- エクスポートパネル -->
      <ExportPanel
      onExportSvg={handleExportSvg}
      onExportPng={handleExportPng}
    />
    </div>
  </header>

  <!-- ツールバー -->
  <Toolbar
    on:addRect={() => fabricCanvas?.addRect()}
    on:addRoundedRect={() => fabricCanvas?.addRoundedRect()}
    on:addCircle={() => fabricCanvas?.addCircle()}
    on:addText={() => fabricCanvas?.addText()}
    on:addLine={() => fabricCanvas?.addLine()}
    on:addBezier={() => fabricCanvas?.addBezier()}
    on:deleteSelected={() => fabricCanvas?.deleteSelected()}
    on:clearAll={() => fabricCanvas?.clearAll()}
    on:undo={() => fabricCanvas?.undo()}
    on:redo={() => fabricCanvas?.redo()}
    on:groupSelected={() => fabricCanvas?.groupSelected()}
    on:ungroupSelected={() => fabricCanvas?.ungroupSelected()}
    on:bringToFront={() => fabricCanvas?.bringToFront()}
    on:bringForward={() => fabricCanvas?.bringForward()}
    on:sendBackwards={() => fabricCanvas?.sendBackwards()}
    on:sendToBack={() => fabricCanvas?.sendToBack()}
    on:flipX={() => fabricCanvas?.flipX()}
    on:flipY={() => fabricCanvas?.flipY()}
  />

  <!-- メインコンテンツ -->
  <div class="flex flex-1 overflow-hidden">
    <!-- 左パネル: テンプレート -->
    <TemplatePanel on:select={handleTemplateSelect} on:selectPart={handlePartSelect} on:selectPreset={handlePresetSelect} on:selectSilhouette={handleSilhouetteSelect} />

    <!-- 中央: キャンバスエディタ -->
    <FabricCanvas bind:this={fabricCanvas} />

    <!-- 右パネル: プロパティ -->
    <PropertiesPanel on:bgColorChange={(e) => fabricCanvas?.setBackgroundColor(e.detail)} />
  </div>

  <!-- フッター -->
  <footer class="flex items-center justify-center gap-x-4 gap-y-0.5 flex-wrap px-5 py-1.5 bg-dark-panel border-t border-white/10 shrink-0 text-xs text-white/40">
    <span>&copy; 2026 <a href="https://czmirror.github.io/portfolio/" target="_blank" rel="noopener noreferrer" class="text-cat-pink/70 hover:text-cat-pink transition-colors">Cz_mirror</a></span>
    <span>·</span>
    <span>MIT License</span>
    <span>·</span>
    <span class="text-white/50">Generated images are free to use, including commercial use.</span>
  </footer>
</div>
