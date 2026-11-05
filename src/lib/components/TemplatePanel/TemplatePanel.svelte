<!-- Presents the asset library and dispatches the chosen template or part to the editor. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { templateCollections, templateCollectionIds, templateCategories } from '$lib/templates/cat';
  import { PRESET_TEXT_COLOR, uiPresets } from '$lib/templates/presets';
  import type { CatTemplate, CatPart, TemplateCategory } from '$lib/types/ui';
  import type { UIPreset } from '$lib/templates/presets';
  import type { CatSilhouette } from '$lib/templates/catSilhouettes';
  import { base } from '$app/paths';
  import type { TemplateCollection } from '$lib/templates/cat';
  import { locale, t } from '$lib/stores/i18n';
  import CatPartsPanel from './CatPartsPanel.svelte';
  import SilhouettePanel from './SilhouettePanel.svelte';

  const dispatch = createEventDispatcher<{ select: CatTemplate; selectPart: CatPart; selectPreset: UIPreset; selectSilhouette: CatSilhouette }>();

  let activeTab: 'templates' | 'parts' | 'presets' | 'silhouettes' = 'templates';
  let activeCollection: TemplateCollection = 'featured';
  let activeCategory: TemplateCategory | 'all' = 'all';

  $: dict = $t;
  $: templates = templateCollections[activeCollection];
  $: filtered = activeCategory === 'all'
    ? templates
    : templates.filter((template) => template.category === activeCategory);

  function selectTemplate(template: CatTemplate) {
    dispatch('select', template);
  }

  function setCategory(id: string) {
    activeCategory = id as TemplateCategory | 'all';
  }

  function lookup(d: Record<string, string>, key: string, fallback: string): string {
    return d[key] ?? fallback;
  }
</script>

<aside class="flex max-h-[24rem] w-full shrink-0 flex-col overflow-hidden border-b border-editor-line bg-editor-panel lg:h-full lg:max-h-none lg:w-[29%] lg:max-w-sm lg:border-b-0 lg:border-r">
  <!-- タブ切替 (横スクロール対応) -->
  <div class="flex border-b border-editor-line shrink-0 overflow-x-auto scrollbar-hide">
    <button
      class="shrink-0 flex-1 whitespace-nowrap px-1.5 py-2 text-[11px] font-bold transition-colors
        {activeTab === 'templates' ? 'text-editor-focus border-b-2 border-editor-focus' : 'text-editor-muted hover:text-editor-ink'}"
      aria-pressed={activeTab === 'templates'}
      on:click={() => (activeTab = 'templates')}
    >
      {dict.templates}
    </button>
    <button
      class="shrink-0 flex-1 whitespace-nowrap px-1.5 py-2 text-[11px] font-bold transition-colors
        {activeTab === 'parts' ? 'text-editor-muted border-b-2 border-editor-focus' : 'text-editor-muted hover:text-editor-ink'}"
      aria-pressed={activeTab === 'parts'}
      on:click={() => (activeTab = 'parts')}
    >
      {dict.parts}
    </button>
    <button
      class="shrink-0 flex-1 whitespace-nowrap px-1.5 py-2 text-[11px] font-bold transition-colors
        {activeTab === 'presets' ? 'text-editor-ink border-b-2 border-editor-focus' : 'text-editor-muted hover:text-editor-ink'}"
      aria-pressed={activeTab === 'presets'}
      on:click={() => (activeTab = 'presets')}
    >
      {dict.presetUi}
    </button>
    <button
      class="shrink-0 flex-1 whitespace-nowrap px-1.5 py-2 text-[11px] font-bold transition-colors
        {activeTab === 'silhouettes' ? 'text-emerald-800 border-b-2 border-emerald-700' : 'text-editor-muted hover:text-editor-ink'}"
      aria-pressed={activeTab === 'silhouettes'}
      on:click={() => (activeTab = 'silhouettes')}
    >
      {dict.silhouettes}
    </button>
  </div>

  <!-- min-h-0 enables flex children to shrink below their content height, allowing overflow-y-auto to work -->
  <div class="flex flex-col flex-1 min-h-0">
  {#if activeTab === 'silhouettes'}
    <SilhouettePanel on:selectSilhouette />
  {:else if activeTab === 'presets'}
    <div class="p-4 border-b border-editor-line">
      <h2 class="text-editor-ink font-bold text-sm uppercase tracking-wider">
        {dict.presetHeader}
      </h2>
      <p class="text-editor-muted text-xs mt-1">{dict.presetDesc}</p>
    </div>
    <div class="grid flex-1 auto-rows-max grid-cols-2 gap-2.5 overflow-y-auto p-3">
      {#each uiPresets as preset (preset.id)}
        <button
          class="w-full rounded-xl overflow-hidden bg-editor-card border border-editor-line
            hover:border-editor-focus/60 transition-all group text-left"
          on:click={() => dispatch('selectPreset', preset)}
        >
          <svg class="block h-24 w-full bg-editor-paper" viewBox="0 50 512 412" aria-hidden="true">
            {#each preset.elements as element}
              {#if 'svgFile' in element}
                <image href="{base}{element.svgFile}" x={element.xRatio * 512} y={element.yRatio * 512}
                  width={element.scaleRatio * 512} height={element.scaleRatio * element.aspectHeight * 512} preserveAspectRatio="xMinYMin meet" />
              {:else}
                <text x={element.xRatio * 512} y={element.yRatio * 512}
                  fill={PRESET_TEXT_COLOR} font-size={element.scaleRatio * 512} font-weight="700"
                  text-anchor="middle" dominant-baseline="central">{element.text}</text>
              {/if}
            {/each}
          </svg>
          <div class="px-2 py-2 text-center">
            <p class="text-editor-ink font-semibold text-sm">{lookup(dict, `preset.${preset.id}`, preset.id)}</p>
            <p class="text-editor-muted text-xs mt-1 leading-tight">{lookup(dict, `presetDesc.${preset.id}`, '')}</p>
          </div>
        </button>
      {/each}
    </div>
  {:else if activeTab === 'parts'}
    <CatPartsPanel on:selectPart />
  {:else}
  <div class="p-4 border-b border-editor-line">
    <div class="mb-3 flex items-center gap-2.5">
      <img src="{base}/brand/shelf-cat.png" alt="" class="h-10 w-auto shrink-0 object-contain" />
      <h2 class="shrink-0 text-lg font-extrabold text-editor-ink sm:text-[22px]">{dict.templateHeader}</h2>
      <span class="h-px flex-1 bg-editor-line" aria-hidden="true"></span>
    </div>
    <div class="mb-3 flex flex-wrap gap-1" role="group" aria-label={dict.templateCollections}>
      {#each templateCollectionIds as collection}
        <button
          class="rounded-md border border-editor-line px-2 py-1 text-xs font-bold
            {activeCollection === collection ? 'bg-cat-peach text-editor-ink' : 'bg-editor-paper text-editor-muted hover:bg-editor-card'}"
          aria-pressed={activeCollection === collection}
          on:click={() => (activeCollection = collection)}
        >
          {dict[`collection.${collection}`]}
        </button>
      {/each}
    </div>
    <!-- カテゴリフィルター -->
    <div class="flex flex-wrap gap-1">
      <button
        class="rounded-full px-1.5 py-1 text-[11px] font-semibold transition-colors
          {activeCategory === 'all' ? 'bg-cat-pink text-editor-ink' : 'bg-editor-paper text-editor-muted hover:bg-editor-stage'}"
        aria-pressed={activeCategory === 'all'}
        on:click={() => (activeCategory = 'all')}
      >
        {dict.all}
      </button>
      {#each templateCategories as cat}
        <button
          class="rounded-full px-1.5 py-1 text-[11px] font-semibold transition-colors
            {activeCategory === cat.id ? 'bg-cat-pink text-editor-ink' : 'bg-editor-paper text-editor-muted hover:bg-editor-stage'}"
          aria-pressed={activeCategory === cat.id}
          on:click={() => setCategory(cat.id)}
        >
          {lookup(dict, `tpl.${cat.id}`, cat.id)}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid flex-1 auto-rows-max grid-cols-2 content-start gap-2.5 overflow-y-auto p-3 sm:grid-cols-3 lg:grid-cols-2">
    {#each filtered as template (template.id)}
      <button
        class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-editor-line bg-editor-card
          text-center transition-colors hover:border-editor-focus focus:border-editor-focus focus-visible:outline-offset-[-3px]"
        title={lookup(dict, `tplDesc.${template.id}`, template.description) || undefined}
        on:click={() => selectTemplate(template)}
      >
        <!-- SVGサムネイル -->
        <div class="flex h-20 w-full items-center justify-center overflow-hidden px-2">
          <img
            src="{base}{template.thumbnail}"
            alt=""
            class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <div class="w-full px-2 pb-3">
          <p class="break-words text-[13px] font-semibold leading-snug text-editor-ink">{lookup(dict, `tpl.${template.id}`, $locale === 'ja' ? template.nameJa : template.name)}</p>
        </div>
      </button>
    {/each}

    {#if filtered.length === 0}
      <div class="col-span-full py-8 text-center text-sm text-editor-muted">
        {dict.noTemplates}
      </div>
    {/if}
  </div>
  {/if}
  </div>
</aside>
