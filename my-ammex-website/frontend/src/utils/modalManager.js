let modalCount = 0;

export const lockScroll = () => {
  modalCount++;
  if (modalCount === 1) {
    document.documentElement.classList.add('overflow-hidden');
    document.body.classList.add('overflow-hidden');
  }
};

export const unlockScroll = () => {
  modalCount = Math.max(0, modalCount - 1);
  if (modalCount === 0) {
    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
  }
};

// Force unlock all (use with caution, mainly for cleanup)
export const forceUnlockScroll = () => {
  modalCount = 0;
  document.documentElement.classList.remove('overflow-hidden');
  document.body.classList.remove('overflow-hidden');
}; 