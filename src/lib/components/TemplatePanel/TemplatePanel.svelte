<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { catTemplates, templateCategories } from '$lib/templates/cat';
  import type { CatTemplate, TemplateCategory } from '$lib/types/ui';

  const dispatch = createEventDispatcher<{ select: CatTemplate }>();

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
</script>

<aside class="w-64 bg-dark-panel flex flex-col h-full border-r border-white/10 overflow-hidden">
  <div class="p-4 border-b border-white/10">
    <h2 class="text-cat-pink font-bold text-sm uppercase tracking-wider mb-3">
      🐾 テンプレート
    </h2>
    <!-- カテゴリフィルター -->
    <div class="flex flex-wrap gap-1">
      <button
        class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
          {activeCategory === 'all' ? 'bg-cat-pink text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
        on:click={() => (activeCategory = 'all')}
      >
        すべて
      </button>
      {#each templateCategories as cat}
        <button
          class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
            {activeCategory === cat.id ? 'bg-cat-pink text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
          on:click={() => setCategory(cat.id)}
        >
          {cat.label}
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
            src={template.thumbnail}
            alt={template.nameJa}
            class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <div class="p-2">
          <p class="text-white font-semibold text-xs">{template.nameJa}</p>
          <p class="text-white/40 text-xs mt-0.5 leading-tight">{template.description}</p>
        </div>
      </button>
    {/each}

    {#if filtered.length === 0}
      <div class="text-center text-white/40 text-sm py-8">
        テンプレートがありません
      </div>
    {/if}
  </div>
</aside>
