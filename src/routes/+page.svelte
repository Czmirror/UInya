<!-- Connects the editor panels to the canvas and handles asset downloads. -->
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
  let toolbar: Toolbar;

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
    if (!dataUrl || dataUrl === 'data:,') return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'uinya-export.png';
    link.click();
  }

  function handleSaveCanvas() {
    if (!fabricCanvas) return;
    const ok = fabricCanvas.saveToLocalStorage();
    toolbar?.showToast(ok ? $t.saveSuccess : $t.saveFailed);
  }

  async function handleLoadCanvas() {
    if (!fabricCanvas) return;
    if (!fabricCanvas.hasSavedData()) {
      toolbar?.showToast($t.loadNoData);
      return;
    }
    const ok = await fabricCanvas.loadFromLocalStorage();
    toolbar?.showToast(ok ? $t.loadSuccess : $t.loadFailed);
  }

  function handleClearSave() {
    if (!fabricCanvas) return;
    const ok = fabricCanvas.clearLocalStorage();
    toolbar?.showToast(ok ? $t.clearSaveSuccess : $t.clearSaveFailed);
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

<div class="flex min-h-screen flex-col bg-editor-paper font-rounded lg:h-screen lg:overflow-hidden">
  <!-- ヘッダー -->
  <header class="flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-editor-line bg-editor-panel px-4 py-2">
    <HeaderLogo />

    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
      <!-- 言語切替 -->
      <button
        class="flex items-center gap-0.5 text-xs font-bold rounded-lg border border-editor-line overflow-hidden"
        on:click={toggleLocale}
      >
        <span class="px-2 py-1 transition-colors {$locale === 'ja' ? 'bg-cat-pink text-editor-ink' : 'text-editor-muted hover:text-editor-ink'}">JA</span>
        <span class="px-2 py-1 transition-colors {$locale === 'en' ? 'bg-cat-pink text-editor-ink' : 'text-editor-muted hover:text-editor-ink'}">EN</span>
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
    bind:this={toolbar}
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
    on:randomCatUI={() => fabricCanvas?.generateRandomCatUI()}
    on:shuffleCatUI={() => fabricCanvas?.shuffleCatUI()}
    on:saveCanvas={handleSaveCanvas}
    on:loadCanvas={handleLoadCanvas}
    on:clearSave={handleClearSave}
  />

  <!-- メインコンテンツ -->
  <div class="flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden">
    <!-- 左パネル: テンプレート -->
    <TemplatePanel on:select={handleTemplateSelect} on:selectPart={handlePartSelect} on:selectPreset={handlePresetSelect} on:selectSilhouette={handleSilhouetteSelect} />

    <!-- 中央: キャンバスエディタ -->
    <FabricCanvas bind:this={fabricCanvas} />

    <!-- 右パネル: プロパティ -->
    <PropertiesPanel on:bgColorChange={(e) => fabricCanvas?.setBackgroundColor(e.detail)} />
  </div>

  <!-- フッター -->
  <footer class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-editor-line bg-editor-panel px-4 py-1.5 text-xs text-editor-muted">
    <img src="{base}/brand/sleeping-cat.png" alt="" class="h-6 w-auto shrink-0 border-r border-editor-line pr-3 object-contain" />
    <span>&copy; 2026 <a href="https://czmirror.github.io/portfolio/" target="_blank" rel="noopener noreferrer" class="text-editor-focus/70 hover:text-editor-focus transition-colors">Cz_mirror</a></span>
    <span>·</span>
    <span>MIT License</span>
    <span>·</span>
    <span class="text-editor-muted">Generated images are free to use, including commercial use.</span>
  </footer>
</div>
