<script lang="ts">
	import ArticleLayout from '$lib/components/ArticleLayout.svelte';

	const date = '2026-10-15';

	const howtoLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'HowTo',
		name: 'How to share your screen over WhatsApp with Wachaut',
		description: 'Share your screen with any WhatsApp contact in under a minute — nothing to install on their phone or your computer.',
		totalTime: 'PT1M',
		tool: [{ '@type': 'HowToTool', name: 'A browser (Chrome, Firefox, Edge or Safari)' }],
		step: [
			{ '@type': 'HowToStep', position: 1, name: 'Open a room on Wachaut', text: 'Go to wachaut.com and click "Share my screen". No sign-up, nothing to install.' },
			{ '@type': 'HowToStep', position: 2, name: 'Choose what to share', text: 'The browser asks for permission: pick a window, a single app or your whole screen. Tick "share audio" if you want sound too.' },
			{ '@type': 'HowToStep', position: 3, name: 'Copy the invite link', text: 'The room generates an invite link with the access PIN already included. One click to copy.' },
			{ '@type': 'HowToStep', position: 4, name: 'Send it over WhatsApp', text: 'Paste it into the WhatsApp chat of whoever should watch you (a person or a group). Opening it puts them straight into your live screen.' },
		],
	});

	const faqs = [
		{
			q: 'Does the recipient need to install anything?',
			a: 'No. They just open the link in any browser, on phone or computer. No sign-up and no downloads for anyone.',
		},
		{
			q: 'How many people can watch my screen at once?',
			a: 'Up to 20 viewers in real time in the same room. That covers most WhatsApp groups.',
		},
		{
			q: 'Does the room link expire?',
			a: 'You can protect the room with a 6-digit PIN and close it whenever you want. When the broadcast ends the room disappears and the link stops working.',
		},
		{
			q: 'Does it work on a computer without installing apps?',
			a: 'Yes. Wachaut runs directly on Chrome, Firefox, Edge and Safari, on Windows, Mac and Linux.',
		},
		{
			q: 'Is the video quality actually good?',
			a: 'In a WhatsApp video call, screen sharing quality drops with the call. With Wachaut you stream in full quality (up to 1080p, 60 fps) with audio, and viewers receive it almost live.',
		},
	];
</script>

<ArticleLayout locale="en" pathEs="/blog/como-compartir-pantalla-por-whatsapp" pathEn="/blog/how-to-share-your-screen-on-whatsapp" title="How to share your screen on WhatsApp (2026) — quick guide" description="WhatsApp can share a screen during video calls, but with limits. How to do it step by step, plus a no-sign-up alternative for groups of up to 20 people." h1="How to share your screen on WhatsApp" {date} faqs={faqs} extraLd={[howtoLd]}>
	<p class="text-[var(--text-muted)] leading-relaxed">
		WhatsApp is the world's most used messaging app: when you want to show something to someone — a video, a TV moment, an error on their phone — the obvious move is to open WhatsApp and send it over. But sharing your <strong class="text-[var(--text)]">screen live</strong> through WhatsApp has a catch: it lives inside the video call, drains battery, and quality suffers. Here are both ways to do it, ordered from simplest to most reliable.
	</p>

	<h2 class="pt-4 text-xl font-bold text-[var(--text)]">Option 1: screen sharing inside a WhatsApp video call</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		WhatsApp includes screen sharing inside its video calls (mobile and desktop). It's quick when you're already on a call, but it pays to know its limits.
	</p>
	<ol class="ml-1 list-decimal space-y-2 pl-5 text-[var(--text-muted)]">
		<li>Start a <strong class="text-[var(--text)]">video call</strong> with the person or the group.</li>
		<li>Tap the <strong class="text-[var(--text)]">Share screen</strong> button among the call controls.</li>
		<li>Confirm the notice and pick the app or screen you want to show.</li>
		<li>To stop, go back to the call and tap the button again or "Stop sharing".</li>
	</ol>
	<div class="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-4 text-sm text-[var(--text-muted)]">
		<strong class="text-[var(--warning)]">Limits worth knowing:</strong>
		<ul class="mt-2 list-disc space-y-1 pl-5">
			<li>Quality adapts to the call, not to your screen: text and fine detail look blurry.</li>
			<li>On mobile, switching apps can cut the share, and battery drains fast.</li>
			<li>With large groups the call degrades, and sharing your screen <em>plus</em> camera at the same time is not always possible.</li>
			<li>When several people need to watch your screen at once, the video call is not the right stage.</li>
		</ul>
	</div>

	<h2 class="pt-4 text-xl font-bold text-[var(--text)]">Option 2 (recommended): share a Wachaut link over WhatsApp</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Start a live broadcast of your screen on <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">wachaut.com</a> — no sign-up, nothing to install — and share the <strong class="text-[var(--text)]">link + PIN</strong> it gives you over WhatsApp. Whoever opens it watches your screen in full quality, almost live. It's the best way to show something to a WhatsApp group: you don't fight the video call for bandwidth, and everyone gets in with one tap.
	</p>
	<ol class="ml-1 list-decimal space-y-2 pl-5 text-[var(--text-muted)]">
		<li>Open <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">wachaut.com/room</a> and click "Share my screen".</li>
		<li>Pick the window or screen; tick the audio box if you want sound.</li>
		<li>Copy the invite (link with PIN included, one click).</li>
		<li>Paste it into the WhatsApp chat or group. Done: up to 20 viewers in real time.</li>
	</ol>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Because it's a link, <strong class="text-[var(--text)]">it doesn't matter where each person connects from</strong> — phone, tablet or computer, WhatsApp or any other chat. And when you finish, close the room and the links stop working: nothing is stored anywhere.
	</p>

	<h2 class="pt-4 text-xl font-bold text-[var(--text)]">FAQ</h2>
	<div class="space-y-3">
		{#each faqs as f}
			<details class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 open:border-[var(--brand)]/25">
				<summary class="cursor-pointer list-none text-sm font-semibold text-[var(--text)] marker:hidden">
					{f.q}
				</summary>
				<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{f.a}</p>
			</details>
		{/each}
	</div>

	<p class="pt-2 text-sm text-[var(--text-subtle)]">
		Looking for alternatives? See <a href="/en/blog/free-online-screen-sharing/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">free online screen sharing</a> for the full comparison. And if you wonder what we do with your data, read how we handle <a href="/en/privacidad/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">privacy</a>.
	</p>
</ArticleLayout>
