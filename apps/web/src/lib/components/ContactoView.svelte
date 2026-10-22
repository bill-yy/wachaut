<script lang="ts">
	import { sendContact } from '$lib/feedback';
	import { dict, type Locale } from '$lib/i18n/dict';
	import { setLocale } from '$lib/i18n/index.svelte';
	import Brand from '$lib/components/Brand.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { Mailbox, Send, Check } from 'lucide-svelte';

	let { locale }: { locale: Locale } = $props();
	const L = $derived(dict[locale]);
	setLocale(locale);

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let sending = $state(false);
	let sent = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (message.trim().length < 5) {
			toast.warning(L['contacto.tooShort']);
			return;
		}
		sending = true;
		const res = await sendContact({ name, email, message: message.trim() });
		sending = false;
		if (res.ok) {
			sent = true;
			toast.success(L['contacto.sentToast']);
		} else {
			toast.error(res.error || L['contacto.failToast']);
		}
	}
</script>

<svelte:head>
	<title>{L['contacto.title']}</title>
	<meta name="description" content={L['contacto.description']} />
	<link rel="canonical" href="https://wachaut.com{locale === 'es' ? '/contacto/' : '/en/contacto/'}" />
	<link rel="alternate" hreflang="es" href="https://wachaut.com/contacto/" />
	<link rel="alternate" hreflang="en" href="https://wachaut.com/en/contacto/" />
	<meta property="og:title" content={L['contacto.title']} />
	<meta property="og:description" content={L['contacto.description']} />
	<meta property="og:url" content="https://wachaut.com{locale === 'es' ? '/contacto/' : '/en/contacto/'}" />
	<meta property="og:locale" content={locale === 'es' ? 'es_ES' : 'en_US'} />
	<meta name="twitter:title" content={L['contacto.title']} />
	<meta name="twitter:description" content={L['contacto.description']} />
</svelte:head>

<div class="relative z-10 flex min-h-screen flex-col overflow-hidden">
	<nav class="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4" aria-label={locale === 'es' ? 'Principal' : 'Main'}>
		<a href={locale === 'es' ? '/' : '/en/'} aria-label="Wachaut"><Brand size="md" /></a>
		<a
			href={locale === 'es' ? '/' : '/en/'}
			class="flex min-h-[44px] items-center px-2 text-sm text-[var(--text-subtle)] transition-colors hover:text-[var(--brand)]"
		>
			{locale === 'es' ? '← Inicio' : '← Home'}
		</a>
	</nav>

	<main class="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-16">
		<div class="mb-8 flex flex-col items-center gap-3 text-center">
			<span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)]/12">
				<Mailbox class="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
			</span>
			<h1 class="text-2xl font-bold text-[var(--text)]">{L['contacto.h1']}</h1>
			<p class="max-w-md text-sm text-[var(--text-muted)]">{L['contacto.subtitle']}</p>
		</div>

		{#if sent}
			<div class="glass mx-auto w-full max-w-lg rounded-2xl p-8 text-center">
				<span class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)]/15">
					<Check class="h-6 w-6 text-[var(--success)]" aria-hidden="true" />
				</span>
				<h2 class="mb-2 text-lg font-bold text-[var(--text)]">{L['contacto.sentTitle']}</h2>
				<p class="mb-6 text-sm text-[var(--text-muted)]">{L['contacto.sentBody']}</p>
				<a href={locale === 'es' ? '/' : '/en/'} class="btn-secondary inline-flex items-center gap-2">{L['contacto.back']}</a>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="glass mx-auto w-full max-w-lg space-y-4 rounded-2xl p-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<Input label={L['contacto.name']} type="text" autocomplete="name" bind:value={name} placeholder={L['contacto.namePlaceholder']} />
					<Input
						label={L['contacto.email']}
						type="email"
						autocomplete="email"
						bind:value={email}
						placeholder={L['contacto.emailPlaceholder']}
					/>
				</div>
				<div>
					<label for="contact-message" class="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">{L['contacto.message']}</label>
					<textarea
						id="contact-message"
						bind:value={message}
						maxlength="2000"
						rows="5"
						required
						aria-invalid={message.trim().length > 0 && message.trim().length < 5 ? 'true' : undefined}
						class="input-field resize-none text-[16px] sm:text-sm"
						placeholder={L['contacto.messagePlaceholder']}
					></textarea>
					{#if message.trim().length > 0 && message.trim().length < 5}
						<p class="mt-1.5 text-xs font-medium text-[var(--danger)]" role="alert">{L['contacto.messageTooShort']}</p>
					{/if}
				</div>
				<Button type="submit" loading={sending} class="w-full justify-center" disabled={message.trim().length < 5}>
					<Send size={16} aria-hidden="true" />
					{L['contacto.send']}
				</Button>
			</form>
		{/if}
	</main>
</div>
