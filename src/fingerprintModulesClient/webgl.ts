import type { moduleClient } from "../types";

export default {
  id: "webgl",
  async getInfo() {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl === null) {
      console.error("WebGL not supported");
      return {};
    }
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return {};

    const renderer = gl.getParameter(
      debugInfo.UNMASKED_RENDERER_WEBGL
    ) as string;
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string;
    return {
      renderer,
      vendor,
    };
  },
} satisfies moduleClient;
