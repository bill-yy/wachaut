<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { size = 'md', class: klass = '' }: Props = $props();

	const px = {
		sm: 'h-4 w-4 border-2',
		md: 'h-6 w-6 border-2',
		lg: 'h-10 w-10 [border-width:3px]',
	};
</script>

<span
	class={cn('inline-block animate-spin rounded-full border-[var(--border)] border-t-[var(--brand)]', px[size], klass)}
	role="status"
	aria-label="Cargando"
></span>
