<script lang="ts">
  import { editorState, updateFill, updateStroke, updateBorderRadius, updateOpacity, updateShadow } from '$lib/stores/editorStore';

  $: state = $editorState;
  $: hasSelection = state.selectedObjectId !== null;
</script>

<aside class="w-64 bg-dark-panel flex flex-col h-full border-l border-white/10 overflow-y-auto">
  <div class="p-4 border-b border-white/10">
    <h2 class="text-cat-lavender font-bold text-sm uppercase tracking-wider">
      ✨ プロパティ
    </h2>
  </div>

  {#if !hasSelection}
    <div class="flex-1 flex items-center justify-center text-white/30 text-sm p-4 text-center">
      <div>
        <div class="text-3xl mb-2">🐾</div>
        <p>図形またはテンプレートを選択してください</p>
      </div>
    </div>
  {:else}
    <div class="p-4 space-y-5">
      <!-- 塗り色 -->
      <div class="prop-section">
        <span class="prop-label">塗り色</span>
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
            aria-label="塗り色の16進数値"
          />
        </div>
      </div>

      <!-- 線の色 -->
      <div class="prop-section">
        <span class="prop-label">線の色</span>
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
            aria-label="線の色の16進数値"
          />
        </div>
      </div>

      <!-- 線の太さ -->
      <div class="prop-section">
        <span class="prop-label">線の太さ: {state.strokeWidth}px</span>
        <input
          id="stroke-width"
          type="range"
          min="0"
          max="20"
          step="1"
          value={state.strokeWidth}
          class="range-input mt-1.5"
          aria-label="線の太さ"
          on:input={(e) => updateStroke(state.strokeColor, Number(e.currentTarget.value))}
        />
      </div>

      <!-- 角丸 -->
      <div class="prop-section">
        <span class="prop-label">角丸: {state.borderRadius}px</span>
        <input
          id="border-radius"
          type="range"
          min="0"
          max="200"
          step="1"
          value={state.borderRadius}
          class="range-input mt-1.5"
          aria-label="角丸"
          on:input={(e) => updateBorderRadius(Number(e.currentTarget.value))}
        />
      </div>

      <!-- 透明度 -->
      <div class="prop-section">
        <span class="prop-label">透明度: {state.opacity}%</span>
        <input
          id="opacity"
          type="range"
          min="0"
          max="100"
          step="1"
          value={state.opacity}
          class="range-input mt-1.5"
          aria-label="透明度"
          on:input={(e) => updateOpacity(Number(e.currentTarget.value))}
        />
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
          影
        </label>
        {#if state.shadowEnabled}
          <div class="mt-2 space-y-2 pl-2 border-l-2 border-cat-lavender/30">
            <div>
              <span class="prop-label-sm">影の色</span>
              <div class="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={state.shadowColor}
                  class="color-input"
                  aria-label="影の色"
                  on:input={(e) => updateShadow(true, e.currentTarget.value)}
                />
              </div>
            </div>
            <div>
              <span class="prop-label-sm">ぼかし: {state.shadowBlur}px</span>
              <input
                type="range"
                min="0"
                max="40"
                value={state.shadowBlur}
                class="range-input mt-1"
                aria-label="影のぼかし"
                on:input={(e) => updateShadow(true, undefined, Number(e.currentTarget.value))}
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="prop-label-sm">X: {state.shadowOffsetX}</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={state.shadowOffsetX}
                  class="range-input mt-1"
                  aria-label="影のX方向オフセット"
                  on:input={(e) => updateShadow(true, undefined, undefined, Number(e.currentTarget.value))}
                />
              </div>
              <div>
                <span class="prop-label-sm">Y: {state.shadowOffsetY}</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={state.shadowOffsetY}
                  class="range-input mt-1"
                  aria-label="影のY方向オフセット"
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
