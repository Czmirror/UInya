<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { catParts, catPartCategories } from '$lib/templates/catParts';
  import type { CatPart, CatPartCategory } from '$lib/types/ui';
  import { base } from '$app/paths';

  const dispatch = createEventDispatcher<{ selectPart: CatPart }>();

  let activeCategory: CatPartCategory | 'all' = 'all';

  $: filtered = activeCategory === 'all'
    ? catParts
    : catParts.filter((p) => p.category === activeCategory);
</script>

<div class="flex flex-col h-full">
  <div class="p-4 border-b border-white/10">
    <h2 class="text-cat-lavender font-bold text-sm uppercase tracking-wider mb-3">
      🐱 パーツ
    </h2>
    <div class="flex flex-wrap gap-1">
      <button
        class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
          {activeCategory === 'all' ? 'bg-cat-lavender text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
        on:click={() => (activeCategory = 'all')}
      >
        すべて
      </button>
      {#each catPartCategories as cat}
        <button
          class="px-2 py-1 rounded-full text-xs font-semibold transition-colors
            {activeCategory === cat.id ? 'bg-cat-lavender text-dark-bg' : 'bg-white/10 text-white/70 hover:bg-white/20'}"
          on:click={() => (activeCategory = cat.id)}
        >
          {cat.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-3">
    <div class="grid grid-cols-2 gap-2">
      {#each filtered as part (part.id)}
        <button
          class="rounded-xl overflow-hidden bg-dark-card border border-white/10
            hover:border-cat-lavender/60 transition-all group text-left"
          on:click={() => dispatch('selectPart', part)}
        >
          <div class="w-full bg-white/5 flex items-center justify-center p-3 h-20 overflow-hidden">
            <img
              src="{base}{part.svgFile}"
              alt={part.nameJa}
              class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <p class="text-white/70 text-[10px] font-semibold text-center py-1.5 px-1 truncate">{part.nameJa}</p>
        </button>
      {/each}
    </div>

    {#if filtered.length === 0}
      <div class="text-center text-white/40 text-sm py-8">
        パーツがありません
      </div>
    {/if}
  </div>
</div>
