import { useEffect, useRef } from "react";

const ActionDropdown = ({ anchorRef, open, onClose, children }) => {
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
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      if (dropdownRef.current) {
        // Account for the global scale transformation (0.8)
        const scale = 0.8;
        const scaledTop = rect.bottom / scale;
        const scaledLeft = rect.left / scale;
        
        dropdownRef.current.style.top = `${scaledTop}px`;
        dropdownRef.current.style.left = `${scaledLeft}px`;
      }
    }
  }, [open, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50"
      style={{ 
        minWidth: anchorRef.current?.offsetWidth,
        transform: 'scale(1)', // 1/0.8 = 1.25 to counteract the global scaling
        transformOrigin: 'top left'
      }}
    >
      {children}
    </div>
  );
};

export default ActionDropdown; 