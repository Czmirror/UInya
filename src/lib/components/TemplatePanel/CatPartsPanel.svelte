<!-- Displays selectable assets for this category of the editor shelf. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { catParts, catPartCategories } from '$lib/templates/catParts';
  import type { CatPart, CatPartCategory } from '$lib/types/ui';
  import { base } from '$app/paths';
  import { locale, t } from '$lib/stores/i18n';

  const dispatch = createEventDispatcher<{ selectPart: CatPart }>();

  let activeCategory: CatPartCategory | 'all' = 'all';

  $: dict = $t;
  $: filtered = activeCategory === 'all'
    ? catParts
    : catParts.filter((p) => p.category === activeCategory);

  function lookup(d: Record<string, string>, key: string, fallback: string): string {
    return d[key] ?? fallback;
  }
</script>

<div class="flex flex-col h-full min-h-0">
  <div class="p-4 border-b border-editor-line">
    <h2 class="text-editor-muted font-bold text-sm uppercase tracking-wider mb-3">
      {dict.partsHeader}
    </h2>
    <div class="flex flex-wrap gap-1">
      <button
        class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
          {activeCategory === 'all' ? 'bg-cat-peach text-editor-ink' : 'bg-editor-paper text-editor-muted hover:bg-editor-stage'}"
        aria-pressed={activeCategory === 'all'}
        on:click={() => (activeCategory = 'all')}
      >
        {dict.all}
      </button>
      {#each catPartCategories as cat}
        <button
          class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
            {activeCategory === cat.id ? 'bg-cat-peach text-editor-ink' : 'bg-editor-paper text-editor-muted hover:bg-editor-stage'}"
          aria-pressed={activeCategory === cat.id}
          on:click={() => (activeCategory = cat.id)}
        >
          {lookup(dict, `cat.${cat.id}`, cat.id)}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-3">
    <div class="grid grid-cols-2 gap-2">
      {#each filtered as part (part.id)}
        <button
          class="rounded-xl overflow-hidden bg-editor-card border border-editor-line
            hover:border-editor-focus/60 transition-all group text-left"
          on:click={() => dispatch('selectPart', part)}
        >
          <div class="w-full bg-editor-card flex items-center justify-center p-3 h-20 overflow-hidden">
            <img
              src="{base}{part.svgFile}"
              alt=""
              class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <p class="text-editor-ink text-xs font-semibold text-center py-1.5 px-1 break-words">{lookup(dict, `part.${part.id}`, $locale === 'ja' ? part.nameJa : part.name)}</p>
        </button>
      {/each}
    </div>

    {#if filtered.length === 0}
      <div class="text-center text-editor-muted text-sm py-8">
        {dict.noParts}
      </div>
    {/if}
  </div>
</div>
