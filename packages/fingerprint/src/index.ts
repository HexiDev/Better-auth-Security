import type { BetterAuthPlugin } from 'better-auth';
import { schema } from './schema';
import type { FingerprintPluginOptions, FingerprintRecord } from './types';
import { createAuthEndpoint, createAuthMiddleware } from 'better-auth/plugins';
import crypto from 'crypto';
const fullSchema = [
	'id',
	'fingerprintId',
	'createdAt',
	'updatedAt',
	'lastSeenAt',
	'ipAddresses',
	'flagged',
	'trusted',
	'users'
];

async function defaultGetFingerprintIdServer(request: Request): Promise<string | null> {
	const headers = request.headers;
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
async function defaultGetFingerprintIdClient(request: Request): Promise<string | null> {
	const headers = request.headers;
	if (!headers) return null;
	const headerValue = headers.get('X-Sc-Ua-Rd');
	return headerValue ? atob(headerValue) : null;
}
async function defaultGetFingerprintIdBoth(request: Request): Promise<string | null> {
	return '123-123-1235';
}
export const fingerprint = (options: FingerprintPluginOptions = {}) => {
	const {
		getFingerprintIdServer = defaultGetFingerprintIdServer,
		getFingerprintIdClient = defaultGetFingerprintIdClient,
		getFingerprintIdBoth = defaultGetFingerprintIdBoth,
		endpoints = ['/sign-in/email'],
		checkType = 'server',
		saveIpAddresses = true
	} = options;
	return {
		id: 'fingerprint',
		schema: schema,
		endpoints: {
			generateFingerprint: createAuthEndpoint(
				'/fingerprint/generate',
				{
					method: 'GET',
					requireRequest: true
				},
				async (ctx) => {
					const getFingerprintId =
						checkType === 'server'
							? getFingerprintIdServer
							: checkType === 'client'
								? getFingerprintIdClient
								: getFingerprintIdBoth;
					const fingerprint = await getFingerprintId(ctx.request);
					return ctx.json({
						fingerprint: fingerprint
					});
				}
			)
		},
		hooks: {
			after: [
				{
					matcher: (context) => {
						return endpoints.includes(context.path);
					},
					handler: createAuthMiddleware({}, async (ctx) => {
						const context = ctx.context;
						const headers = ctx.headers as Headers;
						const request = new Request(`https://${headers.get('host')}` || '', {
							headers: headers
						});
						const session = context?.session;
						if (!context || !headers) throw ctx.error(401, { message: 'Unauthorized' });
						if (!session) return;

						// generate fingerprint ID
						const fingerprintId =
							checkType === 'server'
								? await getFingerprintIdServer(request)
								: checkType === 'client'
									? await getFingerprintIdClient(request)
									: await getFingerprintIdBoth(request);
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
		// middlewares: [
		// 	{
		// 		path: '/sign-out',
		// 		middleware: createAuthMiddleware({}, async (ctx) => {
		// 			const headers = ctx.headers as Headers;
		// 			const request = new Request(`https://${headers.get('host')}` || '', {
		// 				headers: headers
		// 			});
		// 			const fingerprintId = await getFingerprintId(request);
		// 			console.log(request.headers);
		// 			console.log(ctx.context);
		// 			console.log('Fingerprint ID:', fingerprintId);
		// 		})
		// 	}
		// ]
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
