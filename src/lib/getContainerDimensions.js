export const getContainerDimensions = () => {
  if (typeof window !== "undefined") {
    const width = window.innerWidth;
    if (width >= 1024) {
      // lg screens
      return { width: 450, height: 500 };
    } else if (width >= 768) {
      // md screens
      return { width: 300, height: 350 };
    } else {
      // sm screens
      return { width: 280, height: 320 };
    }
  }
  return { width: 350, height: 400 }; // default
};
