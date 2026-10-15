<script lang="ts">
	import ArticleLayout from '$lib/components/ArticleLayout.svelte';

	const date = '2026-10-15';

	const faqs = [
		{
			q: 'What is the fastest way to share a screen?',
			a: 'An instant link with no sign-up: open Wachaut, pick what to share and send the link. Under a minute from start to someone watching you.',
		},
		{
			q: 'Is Wachaut really free?',
			a: 'Yes, all of it: no plans, no time limits and no card asked. Rooms close when you finish and we never store your content.',
		},
		{
			q: 'How many viewers fit in a room?',
			a: 'Up to 20 viewers per room in real time. For bigger audiences (a full class, for example) Zoom or Meet fit better today.',
		},
		{
			q: "What if my connection is slow?",
			a: 'Wachaut lowers quality automatically to stay smooth (and you can pick presets manually). Heavy full-conference tools suffer more with blurry text.',
		},
		{
			q: 'Can I share system audio too?',
			a: 'Yes: when sharing your screen on Wachaut you can include system audio, handy for showing videos or clips.',
		},
	];
</script>

<ArticleLayout locale="en" pathEs="/blog/compartir-pantalla-online-gratis" pathEn="/blog/free-online-screen-sharing" title="Free online screen sharing: which tool to use (2026 comparison)" description="Honest comparison of free screen sharing tools (Wachaut, Zoom, Meet, Discord, AnyDesk): sign-up, installs, limits and when to use each one." h1="Free online screen sharing: which tool should you pick?" {date} faqs={faqs}>
	<p class="text-[var(--text-muted)] leading-relaxed">
		There are more ways than ever to share a screen — and at the same time, more limits than ever on the "free" versions. The right tool depends on three questions: <strong class="text-[var(--text)]">will they make you sign up?, does anything need installing?, how many people will connect?</strong> Here's the comparison with real usage in mind, no marketing.
	</p>

	<div class="overflow-x-auto rounded-xl border border-[var(--border)]">
		<table class="w-full min-w-[640px] border-collapse text-sm">
			<thead>
				<tr class="bg-[var(--surface-2)] text-left text-[var(--text)]">
					<th class="p-3 font-semibold">Tool</th>
					<th class="p-3 font-semibold">Sign-up</th>
					<th class="p-3 font-semibold">Install</th>
					<th class="p-3 font-semibold">Free</th>
					<th class="p-3 font-semibold">Good for</th>
				</tr>
			</thead>
			<tbody class="text-[var(--text-muted)]">
				<tr class="border-t border-[var(--border)] bg-[var(--brand)]/5">
					<td class="p-3 font-semibold text-[var(--brand)]">Wachaut</td>
					<td class="p-3">No</td>
					<td class="p-3">No (browser)</td>
					<td class="p-3">No time limit</td>
					<td class="p-3">Spontaneous, 1–20 viewers</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">Zoom</td>
					<td class="p-3">Yes (host)</td>
					<td class="p-3">Yes (host)</td>
					<td class="p-3">40 min per meeting</td>
					<td class="p-3">Work meetings</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">Google Meet</td>
					<td class="p-3">Yes</td>
					<td class="p-3">No</td>
					<td class="p-3">60 min / 100 people</td>
					<td class="p-3">Work with a Google account</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">Discord</td>
					<td class="p-3">Yes</td>
					<td class="p-3">Recommended</td>
					<td class="p-3">No duration limit</td>
					<td class="p-3">Communities / gaming</td>
				</tr>
				<tr class="border-t border-[var(--border)]">
					<td class="p-3 font-semibold text-[var(--text)]">AnyDesk</td>
					<td class="p-3">No</td>
					<td class="p-3">Yes (both ends)</td>
					<td class="p-3">Personal use</td>
					<td class="p-3">Remote control</td>
				</tr>
			</tbody>
		</table>
	</div>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">If you want speed: the "share it and be done" case</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Typical situation: "watch how this works" to a friend, showing a highlight to the group, walking someone through a setting. No meeting software justifies making someone register for 2 minutes of screen. That's the exact gap <a href="/room" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">Wachaut</a> covers: open a room, share the link (WhatsApp, Telegram, wherever) and in seconds everyone is watching your screen live, with audio and chat. No accounts: when you finish, the room disappears.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">If it's serious work: when Zoom or Meet actually make sense</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Meetings with an agenda, professional recording, breakout rooms, calendar integration — Zoom and Meet are the reference tools. The cost: the host must sign up and their email account ends up tied to the calendar. For recurring work that investment pays off; for occasional use it's dead weight.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">What about Discord?</h2>
	<p class="text-[var(--text-muted)] leading-relaxed">
		Discord is excellent <em>if your community already lives there</em>: quality screen sharing inside a voice channel, no duration limit in normal free use. The catch: everyone else must sign up and install the app. If your audience isn't on Discord, making them create an account just to show them something is a non-starter — Wachaut covers exactly that hole.
	</p>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">Summary: the quick rule</h2>
	<ul class="ml-1 list-disc space-y-2 pl-5 text-[var(--text-muted)]">
		<li><strong class="text-[var(--text)]">1–20 people, right now, no friction</strong> → Wachaut (instant link).</li>
		<li><strong class="text-[var(--text)]">Formal meeting with agenda and recording</strong> → Zoom or Meet.</li>
		<li><strong class="text-[var(--text)]">Community already on the app</strong> → Discord.</li>
		<li><strong class="text-[var(--text)]">Controlling another person's computer</strong> → AnyDesk (a different job).</li>
	</ul>

	<h2 class="pt-5 text-xl font-bold text-[var(--text)]">FAQ</h2>
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
		See also: <a href="/en/blog/how-to-share-your-screen-on-whatsapp/" class="text-[var(--brand)] underline decoration-[var(--brand)]/40 underline-offset-2">how to share your screen on WhatsApp</a>.
	</p>
</ArticleLayout>
