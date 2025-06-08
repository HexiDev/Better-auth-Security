export default {
	id: 'screen',
	async getInfo() {
		return {
			width: screen.width,
			height: screen.height,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			devicePixelRatio: window.devicePixelRatio
		};
	}
};
