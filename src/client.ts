import type { BetterAuthClientPlugin } from "better-auth";
import type { fingerprint } from ".";
import type { BetterFetchPlugin } from "better-auth/svelte";
import type { FingerprintPluginOptionsClient, moduleClient } from "./types";
import defaultModules from "./fingerprintModulesClient";

async function defaultGetFingerprintIdClient(): Promise<string | null> {
  let fingerprintId: string | null = null;
  return fingerprintId || null;
}
export async function getFingerprintId(): Promise<string | null> {
  const fingerprintId = await defaultGetFingerprintIdClient();
  return fingerprintId ? btoa(fingerprintId) : null;
}
export async function getClientDetailsHeader(): Promise<
  Record<string, string>
> {
  const modules = defaultModules as moduleClient[];
  if (modules && modules.length > 0) {
    const moduleData = await Promise.all(
      modules.map(async (module) => {
        if (module.getInfo) {
          const info = await module.getInfo();
          return {
            id: module.id,
            ...info,
          };
        }
        return { id: module.id };
      })
    );
    return {
      "X-Data": btoa(JSON.stringify(moduleData)),
    };
  }
  return {
    "X-Data": btoa(JSON.stringify([])),
  };
}
export const fingerprintClient = (
  fOptions: FingerprintPluginOptionsClient = {}
) => {
  const modules = fOptions.modules || (defaultModules as moduleClient[]);
  if (modules && modules.length > 0) {
    modules.forEach((module) => {
      if (module.init) {
        module.init();
      }
    });
  }
  return {
    id: "fingerprint",
    $InferServerPlugin: {} as ReturnType<typeof fingerprint>,
    pathMethods: {
      "/my-plugin/hello-world": "GET",
    },
    fetchPlugins: [
      {
        id: "fingerprint",
        name: "Fingerprint Plugin",
        init: async (url, options) => {
          if (!options) {
            return { url, options };
          }
          // loop through options.modules
          let items: {
            id: string;
            [key: string]: any;
          }[] = [];
          if (modules && modules.length > 0) {
            for (const module of modules) {
              const info = await module.getInfo();
              if (info) {
                items.push({
                  id: module.id,
                  ...info,
                });
              }
            }
          }
          // add items as base64 encoded string to headers
          options.headers = {
            ...options.headers,
            "X-Data": btoa(JSON.stringify(items)),
          };
          return {
            url,
            options,
          };
        },
      } satisfies BetterFetchPlugin,
    ],
  } satisfies BetterAuthClientPlugin;
};
