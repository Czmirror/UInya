<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { catTemplates, templateCategories } from '$lib/templates/cat';
  import { uiPresets } from '$lib/templates/presets';
  import type { CatTemplate, CatPart, TemplateCategory } from '$lib/types/ui';
  import type { UIPreset } from '$lib/templates/presets';
  import { base } from '$app/paths';
  import { t } from '$lib/stores/i18n';
  import CatPartsPanel from './CatPartsPanel.svelte';

  const dispatch = createEventDispatcher<{ select: CatTemplate; selectPart: CatPart; selectPreset: UIPreset }>();

  let activeTab: 'templates' | 'parts' | 'presets' = 'templates';
  let activeCategory: TemplateCategory | 'all' = 'all';

  $: dict = $t;
  $: filtered = activeCategory === 'all'
    ? catTemplates
    : catTemplates.filter((tpl) => tpl.category === activeCategory);

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

<aside class="w-64 bg-dark-panel flex flex-col h-full border-r border-white/10 overflow-hidden">
  <!-- タブ切替 -->
  <div class="flex border-b border-white/10 shrink-0">
    <button
      class="flex-1 py-2 text-xs font-bold transition-colors
        {activeTab === 'templates' ? 'text-cat-pink border-b-2 border-cat-pink' : 'text-white/40 hover:text-white/60'}"
      on:click={() => (activeTab = 'templates')}
    >
      {dict.templates}
    </button>
    <button
      class="flex-1 py-2 text-xs font-bold transition-colors
        {activeTab === 'parts' ? 'text-cat-lavender border-b-2 border-cat-lavender' : 'text-white/40 hover:text-white/60'}"
      on:click={() => (activeTab = 'parts')}
    >
      {dict.parts}
    </button>
    <button
      class="flex-1 py-2 text-xs font-bold transition-colors
        {activeTab === 'presets' ? 'text-cat-cream border-b-2 border-cat-cream' : 'text-white/40 hover:text-white/60'}"
      on:click={() => (activeTab = 'presets')}
    >
      {dict.presetUi}
    </button>
  </div>

  {#if activeTab === 'presets'}
    <div class="p-4 border-b border-white/10">
      <h2 class="text-cat-cream font-bold text-sm uppercase tracking-wider">
        {dict.presetHeader}
      </h2>
      <p class="text-white/40 text-xs mt-1">{dict.presetDesc}</p>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      {#each uiPresets as preset (preset.id)}
        <button
          class="w-full rounded-xl overflow-hidden bg-dark-card border border-white/10
            hover:border-cat-cream/60 transition-all group text-left"
          on:click={() => dispatch('selectPreset', preset)}
        >
          <div class="p-3">
            <p class="text-white font-semibold text-sm">{lookup(dict, `preset.${preset.id}`, preset.id)}</p>
            <p class="text-white/40 text-xs mt-1 leading-tight">{lookup(dict, `presetDesc.${preset.id}`, '')}</p>
          </div>
        </button>
      {/each}
    </div>
  {:else if activeTab === 'parts'}
    <CatPartsPanel on:selectPart />
  {:else}
  <div class="p-4 border-b border-white/10">
    <h2 class="text-cat-pink font-bold text-sm uppercase tracking-wider mb-3">
      {dict.templateHeader}
    </h2>
    <!-- カテゴリフィルター -->
    <div class="flex flex-wrap gap-1">
      <button
        class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
          {activeCategory === 'all' ? 'bg-cat-pink text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
        on:click={() => (activeCategory = 'all')}
      >
        {dict.all}
      </button>
      {#each templateCategories as cat}
        <button
          class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
            {activeCategory === cat.id ? 'bg-cat-pink text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
          on:click={() => setCategory(cat.id)}
        >
          {lookup(dict, `tpl.${cat.id}`, cat.id)}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-3 space-y-2">
    {#each filtered as template (template.id)}
      <button
        class="w-full rounded-xl overflow-hidden bg-dark-card border border-white/10
          hover:border-cat-pink/60 transition-all group text-left"
        on:click={() => selectTemplate(template)}
      >
        <!-- SVGサムネイル -->
        <div class="w-full bg-white/5 flex items-center justify-center p-2 h-24 overflow-hidden">
          <img
            src="{base}{template.thumbnail}"
            alt={lookup(dict, `tpl.${template.id}`, template.id)}
            class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <div class="p-2">
          <p class="text-white font-semibold text-xs">{lookup(dict, `tpl.${template.id}`, template.id)}</p>
          <p class="text-white/40 text-xs mt-0.5 leading-tight">{lookup(dict, `tplDesc.${template.id}`, '')}</p>
        </div>
      </button>
    {/each}

    {#if filtered.length === 0}
      <div class="text-center text-white/40 text-sm py-8">
        {dict.noTemplates}
      </div>
    {/if}
  </div>
  {/if}
</aside>
