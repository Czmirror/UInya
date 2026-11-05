<!-- Displays selectable assets for this category of the editor shelf. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { catSilhouettes, roundCatSilhouettes } from '$lib/templates/catSilhouettes';
  import type { CatSilhouette } from '$lib/templates/catSilhouettes';
  import { base } from '$app/paths';
  import { locale, t } from '$lib/stores/i18n';

  const dispatch = createEventDispatcher<{ selectSilhouette: CatSilhouette }>();

  let series: 'round' | 'classic' = 'round';
  $: dict = $t;
  $: silhouettes = series === 'round' ? roundCatSilhouettes : catSilhouettes;

  function lookup(d: Record<string, string>, key: string, fallback: string): string {
    return d[key] ?? fallback;
  }
</script>

<div class="flex flex-col h-full min-h-0">
  <div class="p-4 border-b border-editor-line">
    <h2 class="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-1">
      {lookup(dict, 'silhouetteHeader', 'Silhouettes')}
    </h2>
    <div class="mb-2 flex gap-1" role="group" aria-label={dict.silhouetteSeries}>
      <button class="rounded-md border border-editor-line px-2 py-1 text-xs font-bold"
        class:bg-cat-peach={series === 'round'} aria-pressed={series === 'round'}
        on:click={() => (series = 'round')}>{dict.silhouetteRound}</button>
      <button class="rounded-md border border-editor-line px-2 py-1 text-xs font-bold"
        class:bg-cat-peach={series === 'classic'} aria-pressed={series === 'classic'}
        on:click={() => (series = 'classic')}>{dict['collection.classic']}</button>
    </div>
    <p class="text-editor-muted text-xs">{lookup(dict, 'silhouetteDesc', '')}</p>
  </div>

  <div class="flex-1 overflow-y-auto p-3">
    <div class="grid grid-cols-2 gap-2">
      {#each silhouettes as sil (sil.id)}
        <button
          class="rounded-xl overflow-hidden bg-editor-card border border-editor-line
            hover:border-emerald-700/60 transition-all group text-left"
          on:click={() => dispatch('selectSilhouette', sil)}
        >
          <div class="w-full bg-editor-card flex items-center justify-center p-3 h-20 overflow-hidden">
            <img
              src="{base}{sil.svgFile}"
              alt=""
              class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <p class="text-editor-ink text-xs font-semibold text-center py-1.5 px-1 break-words">{lookup(dict, `sil.${sil.id}`, $locale === 'ja' ? sil.nameJa : sil.name)}</p>
        </button>
      {/each}
    </div>
  </div>
</div>
