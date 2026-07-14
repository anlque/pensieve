export const moveFocusOutside = (container: HTMLElement | null, fallback?: HTMLElement | null) => {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof HTMLElement) || !container?.contains(activeElement)) {
    return;
  }

  if (fallback && !(fallback instanceof HTMLButtonElement && fallback.disabled)) {
    fallback.focus();
    return;
  }

  activeElement.blur();
};
