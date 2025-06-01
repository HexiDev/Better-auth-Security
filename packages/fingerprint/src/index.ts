import type { BetterAuthPlugin } from 'better-auth';
import { schema } from './schema';
import type { FingerprintPluginOptions, FingerprintRecord, moduleServer } from './types';
import { createAuthEndpoint, createAuthMiddleware } from 'better-auth/plugins';
import crypto from 'crypto';
import defaultModules from './fingerprintModulesServer';

const fullSchema = [
	'id',
	'fingerprintId',
	'createdAt',
	'updatedAt',
	'lastSeenAt',
	'ipAddresses',
	'flagged',
	'trustScore',
	'users'
];

async function defaultGetFingerprintId(ctx: {
	request: Request;
	context?: {
		checks: {
			id: string;
			weight?: number;
			lying?: boolean;
		}[];
		trustScore: number;
	};
}): Promise<string | null> {
	const headers = ctx.request.headers as Headers;
	//generate a fingerprint ID based on the request based on headers.user-agent+cf-ipcountry
	if (!headers) {
		return null;
	}
	const userAgent = headers.get('user-agent') || '';
	const cfIpCountry = headers.get('cf-ipcountry') || '';
	const secChUa = headers.get('sec-ch-ua') || '';
	const secChUaPlatform = headers.get('sec-ch-ua-platform') || '';
	if (!userAgent && !cfIpCountry) {
		return null;
	}
	return crypto
		.createHash('md5')
		.update(`${userAgent}${cfIpCountry}${secChUa}${secChUaPlatform}`)
		.digest('hex');
}
export const fingerprint = (options: FingerprintPluginOptions = {}) => {
	const {
		getFingerprintId = defaultGetFingerprintId,
		endpoints = ['/sign-in/email',],
		saveIpAddresses = true,
	} = options;
	const modules = options.modules || defaultModules as moduleServer[];
	return {
		id: 'fingerprint',
		schema: schema,
		init: (context) => {
			if (modules && modules.length > 0) {
				modules.forEach(module => {
					if (module.init) {
						module.init();
					}
				});
			}
		},
		hooks: {
			before: [
				{
					matcher: (context) => {
						return endpoints?.includes(context.path) || false;
					},
					handler: createAuthMiddleware({}, async (ctx) => {
						const creation = (async () => {
							const headers = ctx.headers as Headers;
							const request = new Request(`https://${headers.get('host')}` || '', {
								headers: headers
							});
							const checkData:
								{
									id: string;
									[key: string]: any;
								}[]
								= headers.get('X-Data') ? JSON.parse(atob(headers.get('X-Data') || '')) : null;

							if (!headers || !checkData) throw ctx.error(401, { message: 'Unauthorized' });

							//run the modules
							let items: {
								id: string;
								weight?: number;
								lying?: boolean;
							}[] = [];
							let totalWeight = modules?.reduce((acc, module) => acc + (module.weight || 0), 0) || 0;
							if (modules && modules.length > 0) {
								for (const module of modules) {
									const lying = await module.isLying(checkData.find(item => item.id === module.id) ?? {});
									if (!lying) {
										items.push({
											id: module.id,
											weight: module.weight,
											lying
										});
									}
								}
							}
							// get the trust score based on if lying is false and get all the weights that are not lying... And then divide by the total weight
							const trustScore = (items?.reduce((acc, module) => acc + (module.weight || 0), 0) || 0) / totalWeight;

							console.log('Trust Score:', trustScore * 100, '%');

							// generate fingerprint ID
							const fingerprintId = await getFingerprintId({
								request,
								context: {
									checks: items,
									trustScore: Math.round(trustScore * 100)
								}
							});

							// Store processed data in context for after hook
							// @ts-ignore
							ctx.context.fingerprintData = {
								fingerprintId,
								trustScore,
								request,
								headers
							};
						})()
						options.awaited ? await creation : creation;
					})

				}
			],
			after: [
				{
					matcher: (context) => {
						return endpoints?.includes(context.path) || false;
					},
					handler: createAuthMiddleware({}, async (ctx) => {
						const context = ctx.context;
						let session = context?.session;
						// @ts-ignore
						const fingerprintData = context?.fingerprintData;
						// get the session manually
						if (!session) {
							const sessionCookieToken = await ctx.getSignedCookie(
								ctx.context.authCookies.sessionToken.name,
								ctx.context.secret
							);
							if (!sessionCookieToken) {
								return;
							}
							session = await ctx.context.internalAdapter.findSession(decodeURIComponent(sessionCookieToken));
						}

						if (!session || !fingerprintData) return;

						const { fingerprintId, trustScore, headers } = fingerprintData;
						const ipAddress = headers.get('cf-connecting-ip') || headers.get('x-real-ip') || '';

						if (fingerprintId) {
							//save the fingerprint ID to the database
							let fingerprintRecord: FingerprintRecord | null = await ctx.context.adapter.findOne({
								model: 'fingerprint',
								where: [
									{
										field: 'fingerprintId',
										value: fingerprintId
									}
								],
								select: fullSchema
							});
							if (!fingerprintRecord) {
								fingerprintRecord = await ctx.context.adapter.create({
									model: 'fingerprint',
									data: {
										fingerprintId,
										trustScore,
										users: {
											connect: session.user ? [{ id: session.user.id }] : []
										}
									},
									select: fullSchema
								});
							} else {
								await ctx.context.adapter.update({
									model: 'fingerprint',
									where: [
										{
											field: 'fingerprintId',
											value: fingerprintId
										}
									],
									update: {
										users: {
											connect: session.user ? [{ id: session.user.id }] : []
										},
										trustScore,
										...(saveIpAddresses
											? {
												ipAddresses: [...fingerprintRecord.ipAddresses, ipAddress].filter(
													(ip, index, self) => self.indexOf(ip) === index
												)
											}
											: {}),
										lastSeenAt: new Date(),
										updatedAt: new Date()
									}
								});
								fingerprintRecord = await ctx.context.adapter.findOne({
									model: 'fingerprint',
									where: [
										{
											field: 'fingerprintId',
											value: fingerprintId
										}
									],
									select: fullSchema
								});
							}
							if (!fingerprintRecord)
								return console.error(
									new Error('Fingerprint record not found after creation or update')
								);
							console.log('Fingerprint Record:', fingerprintRecord.id);
						}
					})
				}
			]
		}
	} satisfies BetterAuthPlugin;
};

// (async (ctx) => {
// 	const headers = ctx.headers as Headers;
// 	const request = new Request(`https://${headers.get('host')}` || '', {
// 		headers: headers
// 	});
// 	const fingerprintId = await getFingerprintId(request);
// 	const user = ctx.context?.session?.user;
// 	let fingerprintRecord: FingerprintRecord | null = await ctx.context.adapter.findOne({
// 		model: 'fingerprint',
// 		where: [
// 			{
// 				field: 'fingerprintId',
// 				value: fingerprintId
// 			}
// 		],
// 		select: fullSchema
// 	});
// 	if (!fingerprintRecord) {
// 		fingerprintRecord = await ctx.context.adapter.create({
// 			model: 'fingerprint',
// 			data: {
// 				fingerprintId,
// 				users: {
// 					connect: user ? [{ id: user.id }] : []
// 				}
// 			},
// 			select: fullSchema
// 		});
// 	} else {
// 		await ctx.context.adapter.update({
// 			model: 'fingerprint',
// 			where: [
// 				{
// 					field: 'fingerprintId',
// 					value: fingerprintId
// 				}
// 			],
// 			update: {
// 				users: {
// 					connect: user ? [{ id: user.id }] : []
// 				},
// 				lastSeenAt: new Date(),
// 				updatedAt: new Date()
// 			}
// 		});
// 		fingerprintRecord = await ctx.context.adapter.findOne({
// 			model: 'fingerprint',
// 			where: [
// 				{
// 					field: 'fingerprintId',
// 					value: fingerprintId
// 				}
// 			],
// 			select: fullSchema
// 		});
// 	}
// 	console.log(fingerprintRecord);
// })(ctx);
