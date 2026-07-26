import { useEffect, useRef } from "react";
import type { RefObject } from "react";

// Closes an open menu when a pointerdown lands outside its DOM node.
// Deliberately NOT an invisible full-viewport backdrop div — a backdrop
// competes in CSS stacking order with whatever it's layered over, and can
// silently swallow clicks meant for the menu itself if an ancestor (e.g. a
// framer-motion element with a residual inline `transform`) creates its
// own stacking context, putting the backdrop visually/hit-test-wise above
// the menu even though the menu has a higher z-index within its own
// nested context. This is exactly what broke EvidenceGrid.tsx's Delete
// button — the fix is to never intercept clicks with a covering element in
// the first place.
export function useMenuDismissRef<T extends HTMLElement>(
  isOpen: boolean,
  onDismiss: () => void,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  // Kept current via its own effect (never written during render, which
  // the React Compiler's ref rules forbid) so the listener effect below
  // doesn't need onDismiss in its dependency array — its identity is a
  // new function every render.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismissRef.current();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return ref;
}
