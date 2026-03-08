<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { catSilhouettes } from '$lib/templates/catSilhouettes';
  import type { CatSilhouette } from '$lib/templates/catSilhouettes';
  import { base } from '$app/paths';
  import { t } from '$lib/stores/i18n';

  const dispatch = createEventDispatcher<{ selectSilhouette: CatSilhouette }>();

  $: dict = $t;

  function lookup(d: Record<string, string>, key: string, fallback: string): string {
    return d[key] ?? fallback;
  }
</script>

<div class="flex flex-col h-full">
  <div class="p-4 border-b border-white/10">
    <h2 class="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-1">
      {lookup(dict, 'silhouetteHeader', 'Silhouettes')}
    </h2>
    <p class="text-white/40 text-xs">{lookup(dict, 'silhouetteDesc', '')}</p>
  </div>

  <div class="flex-1 overflow-y-auto p-3">
    <div class="grid grid-cols-2 gap-2">
      {#each catSilhouettes as sil (sil.id)}
        <button
          class="rounded-xl overflow-hidden bg-dark-card border border-white/10
            hover:border-emerald-400/60 transition-all group text-left"
          on:click={() => dispatch('selectSilhouette', sil)}
        >
          <div class="w-full bg-white/5 flex items-center justify-center p-3 h-20 overflow-hidden">
            <img
              src="{base}{sil.svgFile}"
              alt={lookup(dict, `sil.${sil.id}`, sil.id)}
              class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform invert"
            />
          </div>
          <p class="text-white/70 text-[10px] font-semibold text-center py-1.5 px-1 truncate">{lookup(dict, `sil.${sil.id}`, sil.id)}</p>
        </button>
      {/each}
    </div>
  </div>
</div>
