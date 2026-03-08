<script lang="ts">
  import { base } from '$app/paths';
  import { t } from '$lib/stores/i18n';

  /**
   * Logo variant selector.
   * - 'paw': original paw icon (default, high visibility at small sizes)
   * - 'catface': new cat face icon (richer detail, may need larger display)
   *
   * To switch logos, change the default value below or pass the prop from a parent.
   */
  export let variant: 'paw' | 'catface' = 'paw';

  const logos = {
    paw: '/icon.svg',
    catface: '/icon-catface.svg',
  } as const;

  $: logoSrc = `${base}${logos[variant]}`;
</script>

<div class="flex items-center gap-3 min-w-0">
  <img src={logoSrc} alt="UInya" class="w-8 h-8 shrink-0" />
  <div class="min-w-0">
    <h1 class="text-xl font-extrabold text-cat-pink leading-none">UInya</h1>
    <p class="text-white/40 text-xs truncate">{$t.subtitle}</p>
  </div>
</div>
