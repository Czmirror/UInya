<!-- Displays the localized UInya wordmark and its header mascot. -->
<script lang="ts">
  import { base } from '$app/paths';
  import { t } from '$lib/stores/i18n';
</script>

<div class="flex min-w-0 items-center gap-3">
  <img src="{base}/brand/header-cat.png" alt="" class="h-10 w-auto sm:h-11 shrink-0 object-contain" />
  <h1 class="shrink-0 text-3xl font-extrabold sm:text-4xl leading-none tracking-tight text-editor-focus">UInya</h1>
  <p class="border-l border-editor-line pl-3 text-sm font-bold leading-tight text-editor-focus sm:text-lg">
    {$t.subtitle}
  </p>
</div>
