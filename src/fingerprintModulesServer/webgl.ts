import type { moduleServer } from "../types";

export default {
	id: "webgl",
	async isLying(ctx) {
		const { renderer, vendor } = ctx;

		if (!renderer || !vendor) return true;

		const normalizedRenderer = renderer.toLowerCase();
		const normalizedVendor = vendor.toLowerCase();

		// Expected mappings
		const expected = [
			{ vendor: 'nvidia', mustInclude: ['nvidia'] },
			{ vendor: 'intel', mustInclude: ['intel'] },
			{ vendor: 'amd', mustInclude: ['amd', 'radeon'] },
			{ vendor: 'google inc.', mustInclude: ['angle'] },
		];

		const matched = expected.find(item => normalizedVendor.includes(item.vendor));

		if (!matched) return true;

		const suspicious =
			matched.mustInclude.some(keyword => !normalizedRenderer.includes(keyword));

		return suspicious;
	},

	weight: 50,
} satisfies moduleServer;