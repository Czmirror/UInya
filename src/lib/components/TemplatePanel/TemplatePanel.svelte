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

  $: filtered = activeCategory === 'all'
    ? catTemplates
    : catTemplates.filter((t) => t.category === activeCategory);

  function selectTemplate(template: CatTemplate) {
    dispatch('select', template);
  }

  function setCategory(id: string) {
    activeCategory = id as TemplateCategory | 'all';
  }

  function tplCatLabel(id: string): string {
    const key = `tpl.${id}` as keyof typeof $t;
    return ($t as Record<string, string>)[key] ?? id;
  }

  function tplName(id: string): string {
    const key = `tpl.${id}` as keyof typeof $t;
    return ($t as Record<string, string>)[key] ?? id;
  }

  function tplDesc(id: string): string {
    const key = `tplDesc.${id}` as keyof typeof $t;
    return ($t as Record<string, string>)[key] ?? '';
  }

  function presetName(id: string): string {
    const key = `preset.${id}` as keyof typeof $t;
    return ($t as Record<string, string>)[key] ?? id;
  }

  function presetDesc(id: string): string {
    const key = `presetDesc.${id}` as keyof typeof $t;
    return ($t as Record<string, string>)[key] ?? '';
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
      {$t.templates}
    </button>
    <button
      class="flex-1 py-2 text-xs font-bold transition-colors
        {activeTab === 'parts' ? 'text-cat-lavender border-b-2 border-cat-lavender' : 'text-white/40 hover:text-white/60'}"
      on:click={() => (activeTab = 'parts')}
    >
      {$t.parts}
    </button>
    <button
      class="flex-1 py-2 text-xs font-bold transition-colors
        {activeTab === 'presets' ? 'text-cat-cream border-b-2 border-cat-cream' : 'text-white/40 hover:text-white/60'}"
      on:click={() => (activeTab = 'presets')}
    >
      {$t.presetUi}
    </button>
  </div>

  {#if activeTab === 'presets'}
    <div class="p-4 border-b border-white/10">
      <h2 class="text-cat-cream font-bold text-sm uppercase tracking-wider">
        {$t.presetHeader}
      </h2>
      <p class="text-white/40 text-xs mt-1">{$t.presetDesc}</p>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      {#each uiPresets as preset (preset.id)}
        <button
          class="w-full rounded-xl overflow-hidden bg-dark-card border border-white/10
            hover:border-cat-cream/60 transition-all group text-left"
          on:click={() => dispatch('selectPreset', preset)}
        >
          <div class="p-3">
            <p class="text-white font-semibold text-sm">{presetName(preset.id)}</p>
            <p class="text-white/40 text-xs mt-1 leading-tight">{presetDesc(preset.id)}</p>
          </div>
        </button>
      {/each}
    </div>
  {:else if activeTab === 'parts'}
    <CatPartsPanel on:selectPart />
  {:else}
  <div class="p-4 border-b border-white/10">
    <h2 class="text-cat-pink font-bold text-sm uppercase tracking-wider mb-3">
      {$t.templateHeader}
    </h2>
    <!-- カテゴリフィルター -->
    <div class="flex flex-wrap gap-1">
      <button
        class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
          {activeCategory === 'all' ? 'bg-cat-pink text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
        on:click={() => (activeCategory = 'all')}
      >
        {$t.all}
      </button>
      {#each templateCategories as cat}
        <button
          class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
            {activeCategory === cat.id ? 'bg-cat-pink text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
          on:click={() => setCategory(cat.id)}
        >
          {tplCatLabel(cat.id)}
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
            alt={tplName(template.id)}
            class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <div class="p-2">
          <p class="text-white font-semibold text-xs">{tplName(template.id)}</p>
          <p class="text-white/40 text-xs mt-0.5 leading-tight">{tplDesc(template.id)}</p>
        </div>
      </button>
    {/each}

    {#if filtered.length === 0}
      <div class="text-center text-white/40 text-sm py-8">
        {$t.noTemplates}
      </div>
    {/if}
  </div>
  {/if}
</aside>
