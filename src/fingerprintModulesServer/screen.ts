import type { moduleServer } from "../types";

export default {
  id: "screen",
  group: "device",
  async isLying(ctx) {
    const { width, height, availWidth, availHeight, devicePixelRatio } = {
      width: Number(ctx.width),
      height: Number(ctx.height),
      availWidth: Number(ctx.availWidth),
      availHeight: Number(ctx.availHeight),
      devicePixelRatio: Number(ctx.devicePixelRatio),
    };

    // Basic validity checks
    if (
      !width ||
      !height ||
      !availWidth ||
      !availHeight ||
      width < 300 ||
      height < 300 // suspiciously small screen
    ) {
      return true;
    }

    // Available size should not be bigger than total size
    if (availWidth > width || availHeight > height) {
      return true;
    }

    // Check if values are just zero
    if (
      width === 0 ||
      height === 0 ||
      availWidth === 0 ||
      availHeight === 0 ||
      devicePixelRatio === 0
    ) {
      return true;
    }

    // Pixel ratio should be within sane range
    if (devicePixelRatio < 0.5 || devicePixelRatio > 10) {
      return true;
    }

    return false;
  },

  weight: 40,
} satisfies moduleServer;
