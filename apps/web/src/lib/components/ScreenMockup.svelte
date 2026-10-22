<script lang="ts">
	import type { Locale } from '$lib/i18n/dict';
	import { dict } from '$lib/i18n/dict';
	import {
		Monitor,
		Radio,
		Users,
		MessageCircle,
		Copy,
		Mic,
		Maximize,
		Send,
		Bell,
		ArrowLeft,
		StopCircle,
	} from 'lucide-svelte';

	// The landing is server-rendered per locale, so the mockup receives the
	// locale as a prop instead of the reactive store (which is ES at SSR).
	let { locale }: { locale: Locale } = $props();
	const L = $derived(dict[locale]);
</script>

<!-- Purely decorative illustration of the product: hidden from assistive
     tech entirely and every fake control is removed from the tab order. -->
<div class="mockup-container relative w-full max-w-2xl select-none" aria-hidden="true">
	<!-- Browser window frame -->
	<div
		class="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
		style="box-shadow: 0 25px 90px -25px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,179,0,0.12), 0 0 70px -25px rgba(255,179,0,0.2);"
	>
		<!-- Top bar / HostHeader -->
		<div class="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
			<div class="flex items-center gap-3">
				<button type="button" tabindex="-1" class="text-[var(--text-subtle)]" aria-label="Volver"><ArrowLeft class="h-4 w-4" /></button>
				<span class="h-4 w-[1px] bg-[var(--border)]"></span>
				<div class="flex items-center gap-2 text-[10px] font-bold text-[var(--danger)]">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-[var(--danger)]"></span>
					</span>
					LIVE
				</div>
				<div class="hidden items-center gap-1.5 text-[10px] text-[var(--text-subtle)] sm:flex">
					<Users class="h-3 w-3" />
					5
				</div>
			</div>
			<div class="flex items-center gap-2">
				<button type="button" tabindex="-1" class="rounded-lg p-1.5 text-[var(--text-subtle)] hover:bg-[var(--surface)]" aria-label={L['mockup.notifications']}>
					<Bell class="h-4 w-4" />
				</button>
			</div>
		</div>

		<!-- Main layout: video + sidebar -->
		<div class="flex min-h-[300px]">
			<!-- Video stage -->
			<div class="relative flex-1 bg-[var(--ink-950)]">
				<div class="absolute inset-0 overflow-hidden">
					<!-- Shared screen placeholder -->
					<div class="absolute inset-0 bg-gradient-to-br from-[var(--surface-2)] to-[var(--ink-900)]">
						<div
							class="absolute inset-0 opacity-20"
							style="background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 24px 24px;"
						></div>
						<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
							<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)]/15 text-[var(--brand)]">
								<Monitor class="h-7 w-7" />
							</div>
							<p class="text-xs font-medium text-[var(--text-muted)]">{L['mockup.sharing']}</p>
						</div>
					</div>

					<!-- Floating video controls -->
					<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-black/60 px-3 py-2 backdrop-blur-md">
						<button type="button" tabindex="-1" class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--danger)] text-white" aria-label={L['mockup.stopShort']}>
							<StopCircle class="h-4 w-4" />
						</button>
						<button type="button" tabindex="-1" class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--text)]" aria-label={L['mockup.fullscreen']}>
							<Maximize class="h-4 w-4" />
						</button>
					</div>

					<!-- Recording badge -->
					<div class="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md"
					>
						<Radio class="h-3 w-3 text-[var(--danger)]" />
						00:42
					</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="hidden w-56 border-l border-[var(--border)] bg-[var(--surface)] p-4 lg:block">
				<!-- Share info -->
				<div class="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
					<p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">{L['mockup.pin']}</p>
					<div class="mb-2 flex items-center justify-center">
						<span class="font-mono text-lg font-bold tracking-[0.2em] text-[var(--text)]">482917</span>
					</div>
					<button type="button" tabindex="-1" class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--surface)] py-1.5 text-[10px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]" aria-label={L['mockup.copy']}>
						<Copy class="h-3 w-3" /> {L['mockup.copy']}
					</button>
				</div>

				<!-- Main action -->
				<button type="button" tabindex="-1" class="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--danger)] py-2.5 text-xs font-semibold text-white transition-all" aria-label={L['mockup.stop']}>
					<StopCircle class="h-4 w-4" /> {L['mockup.stop']}
				</button>

				<!-- Chat preview -->
				<div class="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
				>
					<div class="border-b border-[var(--border)] px-3 py-2">
						<p class="text-[10px] font-semibold text-[var(--text-muted)]">Chat</p>
					</div>
					<div class="space-y-2 p-3">
						<div class="flex gap-2">
							<div class="h-5 w-5 shrink-0 rounded-full bg-[var(--success)]"></div>
							<div>
								<p class="text-[9px] font-medium text-[var(--success)]">Ana</p>
								<p class="text-[10px] text-[var(--text-muted)]">{L['mockup.chatMsg']}</p>
							</div>
						</div>
						<div class="flex gap-2">
							<div class="h-5 w-5 shrink-0 rounded-full bg-[var(--color-blue-600)]"></div>
							<div>
								<p class="text-[9px] font-medium text-[var(--color-blue-600)]">Luis</p>
								<p class="text-[10px] text-[var(--text-muted)]">{L['mockup.zoom']}</p>
							</div>
						</div>
					</div>
					<div class="flex items-center gap-1 border-t border-[var(--border)] p-2">
						<input
							type="text"
							placeholder={L['mockup.type']}
							class="flex-1 rounded-md border-0 bg-transparent px-2 py-1 text-[10px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
							disabled
						/>
						<button type="button" tabindex="-1" class="text-[var(--text-subtle)]" aria-label={L['mockup.send']}><Send class="h-3.5 w-3.5" /></button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Decorative glows -->
	<div
		class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--brand)]/15 blur-2xl"
		aria-hidden="true"
	></div>
	<div
		class="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[var(--brand)]/10 blur-3xl"
		aria-hidden="true"
	></div>
</div>

<style>
	.mockup-container {
		perspective: 1200px;
	}
	.mockup-container > div:first-child {
		transform: rotateY(-10deg) rotateX(5deg);
		animation: mockup-float 8s ease-in-out infinite;
	}
	@keyframes mockup-float {
		0%, 100% { transform: rotateY(-10deg) rotateX(5deg) translateY(0); }
		50% { transform: rotateY(-8deg) rotateX(4deg) translateY(-10px); }
	}
	@media (prefers-reduced-motion: reduce) {
		.mockup-container > div:first-child {
			animation: none;
		}
	}
</style>
