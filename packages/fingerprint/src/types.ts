export interface FingerprintPluginOptions {
	checkType?: 'client' | 'server' | 'both';
	/**
	 * @default ["/get-session"]
	 * List of endpoints to check for suspicious activity.
	 * If `checkType` is 'client', these endpoints will be checked on the client side.
	 */
	endpoints?: string[];
	suspiciousThresholds?: {
		accountsPerFingerprint?: number;
		fingerprintsPerAccount?: number;
		[key: string]: any;
	};
	/**
	 * @default true
	 * Whether to save IP addresses in the fingerprint records.
	 * This can be useful for tracking suspicious activity, but may raise privacy concerns.
	 **/
	saveIpAddresses?: boolean;

	/**
	 * @default 0
	 * Limit for recursive search when checking for suspicious accounts or fingerprints.
	 * This is useful to prevent excessive database queries in case of large datasets.
	 */
	recursiveSearchLimit?: number;

	getFingerprintIdServer?: (request: Request) => Promise<string | null>;
	getFingerprintIdClient?: (request: Request) => Promise<string | null>;
	getFingerprintIdBoth?: (request: Request) => Promise<string | null>;

	onSuspiciousLogin?: (params: {
		fingerprintId: string;
		reason: 'too-many-accounts' | 'too-many-fingerprints';
		linkedAccounts: string[];
	}) => Promise<void>;
	onSuspiciousRegistration?: (params: {
		fingerprintId: string;
		reason: 'too-many-accounts' | 'too-many-fingerprints';
		linkedAccounts: string[];
	}) => Promise<void>;
	onSuspiciousFingerprint?: (params: {
		fingerprintId: string;
		reason: 'too-many-accounts' | 'too-many-fingerprints';
		linkedAccounts: string[];
	}) => Promise<void>;

	isUserIdSuspicious?: (userId: string) => Promise<boolean>;
	isFingerprintIdSuspicious?: (fingerprintId: string) => Promise<boolean>;
}

export interface Context {
	body?: Record<string, unknown>;
	query?: Record<string, unknown>;
}

export interface FingerprintRecord {
	id: string;
	fingerprintId: string;
	createdAt: Date;
	updatedAt: Date;
	lastSeenAt?: Date;
	ipAddresses: string[];
	flagged: boolean;
	trusted: boolean;
	users: {
		id: string;
		name: string;
		email: string;
		emailVerified: boolean;
		image: string;
		createdAt: Date;
		updatedAt: Date;
		phone?: string | null;
	}[];
}
