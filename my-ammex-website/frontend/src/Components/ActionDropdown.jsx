import { useEffect, useRef } from "react";

const ActionDropdown = ({ anchorRef, open, onClose, children, align = "right", verticalOffset = 4, horizontalOffset = 0 }) => {
  const dropdownRef = useRef();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      if (!dropdownRef.current) return;

      const scale = 0.8; // global scale compensation
      const top = (rect.bottom + verticalOffset) / scale;

      // Default place using left edge, then adjust for alignment
      let left = (rect.left + horizontalOffset) / scale;

      // If aligning right, compute using dropdown width
      if (align === "right") {
        const dropdownWidth = dropdownRef.current.offsetWidth || 0;
        left = (rect.right - dropdownWidth - horizontalOffset) / scale;
      }

      // Clamp within viewport with small margin
      const margin = 8;
      const maxLeft = (window.innerWidth - margin) / scale - (dropdownRef.current.offsetWidth || 0);
      const minLeft = margin / scale;
      const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));

      dropdownRef.current.style.top = `${top}px`;
      dropdownRef.current.style.left = `${clampedLeft}px`;
    };

    // First position, then re-measure after paint for accurate width
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, align, verticalOffset, horizontalOffset]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50"
      style={{ 
        minWidth: anchorRef.current?.offsetWidth,
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }}
    >
      {children}
    </div>
  );
};

export default ActionDropdown; 