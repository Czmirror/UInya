<script lang="ts">
  import { editorState, updateFill, updateStroke, updateBorderRadius, updateOpacity, updateShadow, updateFontFamily, fontFamilyOptions } from '$lib/stores/editorStore';
  import { createEventDispatcher } from 'svelte';
  import { t, locale } from '$lib/stores/i18n';

  const dispatch = createEventDispatcher<{ bgColorChange: string | null }>();

  $: state = $editorState;
  $: hasSelection = state.selectedObjectId !== null;

  let bgColor = '#0F3460';
  let bgEnabled = true;

  function handleBgToggle(checked: boolean) {
    bgEnabled = checked;
    dispatch('bgColorChange', checked ? bgColor : null);
  }

  function handleBgColor(color: string) {
    bgColor = color;
    if (bgEnabled) {
      dispatch('bgColorChange', color);
    }
  }
</script>

<aside class="w-64 bg-dark-panel flex flex-col h-full border-l border-white/10 overflow-y-auto">
  <div class="p-4 border-b border-white/10">
    <h2 class="text-cat-lavender font-bold text-sm uppercase tracking-wider">
      {$t.properties}
    </h2>
  </div>

  <!-- 背景設定（常に表示） -->
  <div class="p-4 border-b border-white/10 space-y-2">
    <label class="prop-label flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={bgEnabled}
        class="rounded"
        on:change={(e) => handleBgToggle(e.currentTarget.checked)}
      />
      {$t.bgColor}
    </label>
    {#if bgEnabled}
      <div class="flex items-center gap-2">
        <input
          type="color"
          value={bgColor}
          class="color-input"
          on:input={(e) => handleBgColor(e.currentTarget.value)}
        />
        <input
          type="text"
          value={bgColor}
          class="text-input flex-1"
          on:change={(e) => handleBgColor(e.currentTarget.value)}
          aria-label={$t.bgColor}
        />
      </div>
    {/if}
  </div>

  {#if !hasSelection}
    <div class="flex-1 flex items-center justify-center text-white/30 text-sm p-4 text-center">
      <div>
        <p class="text-3xl mb-2">🐾</p>
        <p>{$t.selectPrompt}</p>
      </div>
    </div>
  {:else}
    <div class="p-4 space-y-5">
      <!-- 塗り色 -->
      <div class="prop-section">
        <span class="prop-label">{$t.fill}</span>
        <div class="flex items-center gap-2 mt-1.5">
          <input
            id="fill-color"
            type="color"
            value={state.fillColor}
            class="color-input"
            on:input={(e) => updateFill(e.currentTarget.value)}
          />
          <input
            type="text"
            value={state.fillColor}
            class="text-input flex-1"
            on:change={(e) => updateFill(e.currentTarget.value)}
            aria-label={$t.fill}
          />
        </div>
      </div>

      <!-- 線の色 -->
      <div class="prop-section">
        <span class="prop-label">{$t.strokeColor}</span>
        <div class="flex items-center gap-2 mt-1.5">
          <input
            id="stroke-color"
            type="color"
            value={state.strokeColor}
            class="color-input"
            on:input={(e) => updateStroke(e.currentTarget.value)}
          />
          <input
            type="text"
            value={state.strokeColor}
            class="text-input flex-1"
            on:change={(e) => updateStroke(e.currentTarget.value)}
            aria-label={$t.strokeColor}
          />
        </div>
      </div>

      <!-- 線の太さ -->
      <div class="prop-section">
        <div class="flex justify-between items-center">
          <label for="stroke-width" class="prop-label">{$t.strokeWidth}</label>
          <span class="text-cat-pink text-xs font-semibold">{state.strokeWidth}px</span>
        </div>
        <input
          id="stroke-width"
          type="range"
          min="0"
          max="20"
          step="1"
          value={state.strokeWidth}
          class="range-input mt-1.5"
          on:input={(e) => updateStroke(state.strokeColor, Number(e.currentTarget.value))}
        />
      </div>

      <!-- 角丸 -->
      <div class="prop-section">
        <div class="flex justify-between items-center">
          <label for="border-radius" class="prop-label">{$t.borderRadius}</label>
          <span class="text-cat-pink text-xs font-semibold">{state.borderRadius}px</span>
        </div>
        <input
          id="border-radius"
          type="range"
          min="0"
          max="200"
          step="1"
          value={state.borderRadius}
          class="range-input mt-1.5"
          on:input={(e) => updateBorderRadius(Number(e.currentTarget.value))}
        />
      </div>

      <!-- 透明度 -->
      <div class="prop-section">
        <div class="flex justify-between items-center">
          <label for="opacity" class="prop-label">{$t.opacity}</label>
          <span class="text-cat-pink text-xs font-semibold">{state.opacity}%</span>
        </div>
        <input
          id="opacity"
          type="range"
          min="0"
          max="100"
          step="1"
          value={state.opacity}
          class="range-input mt-1.5"
          on:input={(e) => updateOpacity(Number(e.currentTarget.value))}
        />
      </div>

      <!-- フォント -->
      <div class="prop-section">
        <label for="font-family" class="prop-label">{$t.fontFamily}</label>
        <select
          id="font-family"
          class="text-input w-full mt-1.5"
          value={state.fontFamily}
          on:change={(e) => updateFontFamily(e.currentTarget.value)}
        >
          {#each fontFamilyOptions as opt}
            <option value={opt.value}>{$locale === 'ja' ? opt.labelJa : opt.labelEn}</option>
          {/each}
        </select>
      </div>

      <!-- シャドウ -->
      <div class="prop-section">
        <label class="prop-label flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.shadowEnabled}
            class="rounded"
            on:change={(e) => updateShadow(e.currentTarget.checked)}
          />
          {$t.shadow}
        </label>
        {#if state.shadowEnabled}
          <div class="mt-2 space-y-2 pl-2 border-l-2 border-cat-lavender/30">
            <div>
              <span class="prop-label-sm">{$t.shadowColor}</span>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={state.shadowColor}
                  class="color-input"
                  aria-label={$t.shadowColor}
                  on:input={(e) => updateShadow(true, e.currentTarget.value)}
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between items-center">
                <span class="prop-label-sm">{$t.blur}</span>
                <span class="text-cat-lavender text-xs">{state.shadowBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={state.shadowBlur}
                class="range-input mt-1"
                aria-label={$t.blur}
                on:input={(e) => updateShadow(true, undefined, Number(e.currentTarget.value))}
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <div class="flex justify-between items-center">
                  <span class="prop-label-sm">{$t.xOffset}</span>
                  <span class="text-cat-lavender text-xs">{state.shadowOffsetX}</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={state.shadowOffsetX}
                  class="range-input mt-1"
                  aria-label={$t.xOffset}
                  on:input={(e) => updateShadow(true, undefined, undefined, Number(e.currentTarget.value))}
                />
              </div>
              <div>
                <div class="flex justify-between items-center">
                  <span class="prop-label-sm">{$t.yOffset}</span>
                  <span class="text-cat-lavender text-xs">{state.shadowOffsetY}</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={state.shadowOffsetY}
                  class="range-input mt-1"
                  aria-label={$t.yOffset}
                  on:input={(e) => updateShadow(true, undefined, undefined, undefined, Number(e.currentTarget.value))}
                />
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</aside>

<style>
  .prop-section {
    @apply space-y-0;
  }
  .prop-label {
    @apply text-white/70 text-xs font-semibold uppercase tracking-wider block;
  }
  .prop-label-sm {
    @apply text-white/50 text-xs block;
  }
  .color-input {
    @apply w-9 h-9 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5;
  }
  .text-input {
    @apply bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white
      focus:outline-none focus:border-cat-pink/60;
  }
  .range-input {
    @apply w-full accent-cat-pink;
  }
</style>
