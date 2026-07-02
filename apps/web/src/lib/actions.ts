/**
 * Svelte action: calls `callback` when a click lands outside the node
 * or the Escape key is pressed. Used to dismiss popovers/pickers.
 *
 * Usage:  <div use:clickOutside={() => (open = false)}>...</div>
 */
export function clickOutside(node: HTMLElement, callback: () => void) {
  function onClick(event: MouseEvent) {
    if (!node.contains(event.target as Node)) {
      callback();
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      callback();
    }
  }

  // Defer attaching so the click that opened the picker doesn't immediately close it
  const timer = setTimeout(() => {
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeydown, true);
  }, 0);

  return {
    destroy() {
      clearTimeout(timer);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeydown, true);
    },
  };
}
