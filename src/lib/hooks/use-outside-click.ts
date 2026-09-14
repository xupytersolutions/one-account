import { useEffect } from "react";

/**
 * Closes dropdown/popover when clicking outside
 */
export function useOutsideClick(
  isOpen: boolean,
  onClose: () => void,
  selector: string
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest(selector)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, onClose, selector]);
}
