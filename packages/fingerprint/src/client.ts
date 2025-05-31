import type { BetterAuthClientPlugin } from 'better-auth';
import type { fingerprint } from '.';
import type { BetterFetchPlugin } from 'better-auth/svelte';
async function defaultGetFingerprintIdClient(): Promise<string | null> {
	let fingerprintId: string | null = null;
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		const module = await import('@fingerprintjs/fingerprintjs');
		const FingerprintJS = module.default;
		const fingerprintJS = await FingerprintJS.load({});
		fingerprintId = (await fingerprintJS.get()).visitorId;
	}
	return fingerprintId || null;
}
export async function getFingerprintId(): Promise<string | null> {
	const fingerprintId = await defaultGetFingerprintIdClient();
	return fingerprintId ? btoa(fingerprintId) : null;
}
export const fingerprintClient = () => {
	let fingerprintId: string | null = null;
	return {
		id: 'fingerprint',
		$InferServerPlugin: {} as ReturnType<typeof fingerprint>,
		pathMethods: {
			'/my-plugin/hello-world': 'GET'
		},
		fetchPlugins: [
			{
				id: 'fingerprint',
				name: 'Fingerprint Plugin',
				init: async (url, options) => {
					if (!options) {
						return { url, options };
					}
					options.headers = {
						...options?.headers,
						'X-Sc-Ua-Rd': fingerprintId ? btoa(fingerprintId) : 'unknown'
					};
					return {
						url,
						options
					};
				}
			} satisfies BetterFetchPlugin
		]
	} satisfies BetterAuthClientPlugin;
};
