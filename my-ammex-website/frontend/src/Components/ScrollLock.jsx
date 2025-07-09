import { useEffect } from "react";
import { lockScroll, unlockScroll } from "../utils/modalManager";

const ScrollLock = ({ active }) => {
  useEffect(() => {
    if (active) lockScroll();
    return () => {
      if (active) unlockScroll();
    };
  }, [active]);
  return null;
};

export default ScrollLock; 