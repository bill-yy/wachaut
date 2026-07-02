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

/**
 * Svelte action: traps keyboard focus inside `node` while it is mounted.
 *
 * - On activation: saves the previously focused element and moves focus into
 *   the first focusable child of `node`.
 * - Keeps Tab/Shift+Tab cycling within `node`.
 * - On destroy: restores focus to the previously focused element.
 *
 * Resolves accessibility finding I1 (no focus trap in modals). Designed to be
 * applied to the inner panel of a modal/dialog, e.g.:
 *   <div role="dialog" use:focusTrap>...</div>
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function focusTrap(node: HTMLElement) {
  let previouslyFocused: HTMLElement | null =
    (document.activeElement as HTMLElement) ?? null;

  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !node.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  // Move focus in on the next frame (lets the DOM settle).
  const raf = requestAnimationFrame(() => {
    const focusable = getFocusable();
    (focusable[0] ?? node).focus();
  });

  document.addEventListener('keydown', onKeydown);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeydown);
      previouslyFocused?.focus?.();
    },
  };
}
