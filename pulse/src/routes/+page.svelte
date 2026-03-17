<script lang="ts">
	// Animation presets
	const PRESETS = ['pulse', 'glow', 'bounce', 'shake'] as const;
	type Preset = (typeof PRESETS)[number];

	let selectedPreset: Preset = 'pulse';
	let speed = 1.0;
	let svgContent = '';
	let fileName = '';
	let animating = false;

	function handleFileLoad(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		fileName = file.name;
		const reader = new FileReader();
		reader.onload = (e) => {
			svgContent = (e.target?.result as string) ?? '';
		};
		reader.readAsText(file);
	}

	function getAnimationStyle(preset: Preset, spd: number): string {
		const duration = (1 / spd).toFixed(2);
		switch (preset) {
			case 'pulse':
				return `animation: pulse ${duration}s ease-in-out infinite`;
			case 'glow':
				return `animation: glow ${duration}s ease-in-out infinite`;
			case 'bounce':
				return `animation: bounce ${duration}s ease-in-out infinite`;
			case 'shake':
				return `animation: shake ${duration}s linear infinite`;
			default:
				return '';
		}
	}

	$: animStyle = animating ? getAnimationStyle(selectedPreset, speed) : '';
</script>

<svelte:head>
	<title>Pulse — Animation Preview</title>
	<style>
		@keyframes pulse {
			0%, 100% { transform: scale(1); opacity: 1; }
			50% { transform: scale(1.08); opacity: 0.85; }
		}
		@keyframes glow {
			0%, 100% { filter: drop-shadow(0 0 4px #e040fb); }
			50% { filter: drop-shadow(0 0 16px #e040fb) drop-shadow(0 0 32px #e040fb88); }
		}
		@keyframes bounce {
			0%, 100% { transform: translateY(0); }
			50% { transform: translateY(-12px); }
		}
		@keyframes shake {
			0%, 100% { transform: rotate(0deg); }
			25% { transform: rotate(-4deg); }
			75% { transform: rotate(4deg); }
		}
	</style>
</svelte:head>

<div class="flex flex-col h-screen">
	<!-- Header -->
	<header class="flex items-center gap-3 px-6 py-3 border-b border-purple-900/40 bg-[#16213e]">
		<span class="text-2xl">💜</span>
		<h1 class="text-xl font-bold tracking-wide text-purple-200">Pulse</h1>
		<span class="text-sm text-purple-400 ml-2">Animation Preview</span>
	</header>

	<div class="flex flex-1 overflow-hidden">
		<!-- Left panel: controls -->
		<aside class="w-64 flex-shrink-0 bg-[#16213e] border-r border-purple-900/40 p-4 flex flex-col gap-5">
			<!-- File loader -->
			<div>
				<label class="block text-xs font-semibold text-purple-300 mb-1 uppercase tracking-widest">Load SVG</label>
				<label
					class="flex items-center justify-center w-full h-10 rounded-lg border-2 border-dashed border-purple-600 text-purple-400 text-sm cursor-pointer hover:border-purple-400 hover:text-purple-200 transition"
				>
					{fileName || 'Choose file…'}
					<input type="file" accept=".svg,.png" class="hidden" on:change={handleFileLoad} />
				</label>
			</div>

			<!-- Preset picker -->
			<div>
				<label class="block text-xs font-semibold text-purple-300 mb-2 uppercase tracking-widest">Preset</label>
				<div class="flex flex-col gap-2">
					{#each PRESETS as preset}
						<button
							class="w-full py-2 rounded-lg text-sm font-medium transition capitalize
								{selectedPreset === preset
									? 'bg-purple-600 text-white'
									: 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/50'}"
							on:click={() => (selectedPreset = preset)}
						>
							{preset}
						</button>
					{/each}
				</div>
			</div>

			<!-- Speed -->
			<div>
				<label class="flex justify-between text-xs font-semibold text-purple-300 mb-1 uppercase tracking-widest">
					<span>Speed</span>
					<span class="text-purple-200">{speed.toFixed(1)}×</span>
				</label>
				<input
					type="range"
					min="0.2"
					max="4"
					step="0.1"
					bind:value={speed}
					class="w-full accent-purple-500"
				/>
			</div>

			<!-- Play / Stop -->
			<button
				class="mt-auto w-full py-3 rounded-xl font-bold text-white transition
					{animating ? 'bg-rose-600 hover:bg-rose-500' : 'bg-purple-600 hover:bg-purple-500'}"
				on:click={() => (animating = !animating)}
			>
				{animating ? '⏹ Stop' : '▶ Play'}
			</button>
		</aside>

		<!-- Canvas area -->
		<main class="flex-1 flex items-center justify-center bg-[#1a1a2e] relative overflow-hidden">
			{#if svgContent}
				<div
					class="max-w-xs max-h-xs select-none"
					style={animStyle}
				>
					{@html svgContent}
				</div>
			{:else}
				<div class="text-center text-purple-700">
					<div class="text-6xl mb-4">💜</div>
					<p class="text-lg font-semibold">Load an SVG to preview animations</p>
					<p class="text-sm mt-2">Export an asset from UInya, then open it here</p>
				</div>
			{/if}
		</main>
	</div>
</div>
