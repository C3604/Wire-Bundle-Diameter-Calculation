export function bindOverlayClose(overlay, onClose) {
  if (!overlay || typeof onClose !== "function") return;
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      onClose();
    }
  });
}

