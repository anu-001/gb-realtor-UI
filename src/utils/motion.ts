const easeOut = "easeOut" as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easeOut } },
};

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeOut } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2, ease: easeOut } },
};

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easeOut } },
};

export const drawerAnimation = {
  initial: { x: "100%" },
  animate: { x: 0, transition: { duration: 0.2, ease: easeOut } },
  exit: { x: "100%", transition: { duration: 0.2, ease: easeOut } },
};

export const modalAnimation = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: easeOut } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: easeOut } },
};
