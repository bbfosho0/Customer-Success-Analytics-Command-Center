export const canonicalViewports = {
  desktopXL: {
    name: "Desktop XL 1440x1000",
    styles: { width: "1440px", height: "1000px" },
  },
  desktop: {
    name: "Desktop 1280x900",
    styles: { width: "1280px", height: "900px" },
  },
  tablet: {
    name: "Tablet 1024x768",
    styles: { width: "1024px", height: "768px" },
  },
  mobile: {
    name: "Mobile 390x844",
    styles: { width: "390px", height: "844px" },
  },
  smallMobile: {
    name: "Small Mobile 360x800",
    styles: { width: "360px", height: "800px" },
  },
} as const;
