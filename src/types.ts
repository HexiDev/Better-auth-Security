export interface moduleServer {
  /**
   * Unique identifier for the module.
   * This should be a string that uniquely identifies the module.
   * This is used also for inside the server side to link 2 modules together.
   */
  id: string;
  /**
   * Optional group name for the module. So you can group modules together.
   * This can be useful if modules are related or belong to the same category.
   */
  group?: string;
  isLying: (ctx: { [key: string]: string }) => Promise<boolean>;
  init?: () => Promise<void>;
  /**
   * @default (ctx) => Object.entries(ctx).reduce((acc, [k, v]) => acc + k + v, "")
   * Optional method to format the information returned by `getInfo`.
   * If provided, it will be used to format the output of the module.
   */
  getFormattedInfo?: (
    ctx: Awaited<ReturnType<moduleClient["getInfo"]>>
  ) => string;
  weight?: number;
}
export interface moduleClient {
  id: string;
  getInfo: () => Promise<Record<string, string> | {}>;
  init?: () => Promise<void>;
}
export interface FingerprintPluginOptions {
  checkType?: "client" | "server" | "both";
  /**
   * @default ["/get-session"]
   * List of endpoints to check for suspicious activity.
   * If `checkType` is 'client', these endpoints will be checked on the client side.
   */
  endpoints?: string[];
  /**
   * @default true
   * Whether to await the creation of the fingerprint inside the database.
   */
  awaited?: boolean;
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

  keys?: {
    publicKey: string;
    privateKey: string;
  };

  getFingerprintId?: (ctx: {
    request: Request;
    context?: {
      checks: {
        id: string;
        weight?: number;
        lying?: boolean;
      }[];
      trustScore: number;
    };
  }) => Promise<string | null>;

  onSuspiciousLogin?: (params: {
    fingerprintId: string;
    reason: "too-many-accounts" | "too-many-fingerprints";
    linkedAccounts: string[];
  }) => Promise<void>;
  onSuspiciousRegistration?: (params: {
    fingerprintId: string;
    reason: "too-many-accounts" | "too-many-fingerprints";
    linkedAccounts: string[];
  }) => Promise<void>;
  onSuspiciousFingerprint?: (params: {
    fingerprintId: string;
    reason: "too-many-accounts" | "too-many-fingerprints";
    linkedAccounts: string[];
  }) => Promise<void>;

  isUserIdSuspicious?: (userId: string) => Promise<boolean>;
  isFingerprintIdSuspicious?: (fingerprintId: string) => Promise<boolean>;
  modules?: moduleServer[];
}
export interface FingerprintPluginOptionsClient {
  modules?: moduleClient[];
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
