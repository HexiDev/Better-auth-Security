# Better-Auth Security Plugin

A security-focused plugin for [better-auth](https://www.better-auth.com/) built with TypeScript and Bun runtime, providing enhanced authentication security features.

## About

This plugin extends better-auth with additional security capabilities, focusing on device fingerprinting and fraud prevention. Built with TypeScript for type safety and Bun for optimal performance.

## Features

### 📱 Fingerprint Package

The Fingerprint plugin provides advanced device fingerprinting capabilities for enhanced authentication security. It tracks device characteristics, detects suspicious behavior, and helps prevent account takeover attacks through client-side and server-side fingerprint analysis.

## Installation

### Add the Server Plugin

Add the Fingerprint plugin to your auth configuration:

**auth.ts**

```typescript
import { betterAuth } from "better-auth";
import { fingerprint } from "better-auth-security/fingerprint";

export const auth = betterAuth({
  plugins: [
    fingerprint({
      // Optional server configuration:
      checkType: "both", // 'client' | 'server' | 'both'
      endpoints: ["/sign-in/email", "/sign-up/email"],
      awaited: true,
      saveIpAddresses: true,
      suspiciousThresholds: {
        accountsPerFingerprint: 3,
        fingerprintsPerAccount: 5,
      },
      recursiveSearchLimit: 10,
    }),
  ],
});
```

### Add the Client Plugin

Add the client plugin to handle browser-based fingerprinting:

```typescript
import { createAuthClient } from "better-auth/client";
import { fingerprintClient } from "better-auth-security/fingerprint/client";

export const authClient = createAuthClient({
  plugins: [
    fingerprintClient({
      // Optional client configuration:
      modules: [], // Custom fingerprinting modules
    }),
  ],
});
```

## Usage

The fingerprint plugin automatically runs during authentication flows on the configured endpoints. No manual invocation is required - it seamlessly integrates with your existing sign-in and sign-up processes.

### Automatic Fingerprinting

The plugin automatically:

- Collects device characteristics (screen, WebGL, browser features)
- Generates unique fingerprint IDs
- Tracks suspicious patterns
- Links fingerprints to user accounts
- Calculates trust scores based on device authenticity

### Custom Fingerprint Generation

You can customize how fingerprint IDs are generated:

```typescript
fingerprint({
  getFingerprintId: async (ctx) => {
    const { request, context } = ctx;
    const headers = request.headers;

    // Custom fingerprint logic
    const userAgent = headers.get("user-agent") || "";
    const acceptLanguage = headers.get("accept-language") || "";

    return crypto
      .createHash("sha256")
      .update(`${userAgent}${acceptLanguage}${context?.trustScore}`)
      .digest("hex");
  },
});
```

## Configuration Options

### Server Options

- **checkType**: Where to perform fingerprint checks. Options: `'client'`, `'server'`, `'both'`. Default: `'both'`
- **endpoints**: Array of endpoints to monitor for suspicious activity. Default: `['/sign-in/email']`
- **awaited**: Whether to await fingerprint creation in the database. Default: `true`
- **saveIpAddresses**: Store IP addresses for tracking. Default: `true`
- **recursiveSearchLimit**: Limit for recursive suspicious account searches. Default: `0`

### Suspicious Activity Thresholds

```typescript
suspiciousThresholds: {
    accountsPerFingerprint: 3,  // Max accounts per fingerprint
    fingerprintsPerAccount: 5   // Max fingerprints per account
}
```

### Event Handlers

Handle suspicious activity with custom callbacks:

```typescript
fingerprint({
  onSuspiciousLogin: async (params) => {
    console.warn("Suspicious login detected:", params);
    // Send alert, block user, etc.
  },
  onSuspiciousRegistration: async (params) => {
    console.warn("Suspicious registration:", params);
    // Additional verification required
  },
  onSuspiciousFingerprint: async (params) => {
    console.warn("Suspicious fingerprint:", params);
    // Flag for manual review
  },
});
```

### Custom Security Checks

Implement custom user and fingerprint validation:

```typescript
fingerprint({
  isUserIdSuspicious: async (userId) => {
    // Custom logic to check if user is suspicious
    return await checkUserInBlacklist(userId);
  },
  isFingerprintIdSuspicious: async (fingerprintId) => {
    // Custom logic to check if fingerprint is suspicious
    return await checkFingerprintReputation(fingerprintId);
  },
});
```

## Fingerprint Modules

The plugin includes built-in modules for device fingerprinting:

### Client-Side Modules

- **Screen Module**: Captures screen dimensions and pixel ratio
- **WebGL Module**: Detects graphics card and renderer information

### Server-Side Modules

- **Screen Validation**: Detects impossible or suspicious screen configurations
- **WebGL Validation**: Identifies mismatched vendor/renderer combinations

### Custom Modules

Create custom fingerprinting modules:

**Client Module:**

```typescript
const customClientModule = {
  id: "custom-client",
  async getInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    };
  },
};
```

**Server Module:**

```typescript
const customServerModule = {
  id: "custom-server",
  async isLying(ctx) {
    const { timezone, language } = ctx;
    // Validate timezone/language consistency
    return !isValidTimezoneLanguagePair(timezone, language);
  },
  weight: 30,
};
```

## Database Schema

The plugin automatically creates a fingerprint table with the following structure:

```typescript
{
    id: string;
    fingerprintId: string;
    createdAt: Date;
    updatedAt: Date;
    lastSeenAt: Date;
    ipAddresses: string[];
    flagged: boolean;
    trustScore: number;
    users: string[]; // Array of linked user IDs
}
```

## Security Notice

This plugin implements security measures for authentication systems. Use responsibly and ensure proper configuration for your security requirements. Always test thoroughly in development environments before production deployment.

### Privacy Considerations

- **IP Address Storage**: Can be disabled by setting `saveIpAddresses: false`
- **Fingerprint Data**: Only non-personally identifiable device characteristics are collected
- **Data Retention**: Consider implementing data retention policies for compliance

### Best Practices

1. **Gradual Rollout**: Start with monitoring mode before enforcement
2. **Threshold Tuning**: Adjust suspicious activity thresholds based on your user base
3. **Don't outright block users**: Use flags and alerts instead of immediate blocks as the hacker can't bypass it very easily
4. **Manual Review**: Implement human review for flagged accounts
5. **Regular Updates**: Keep fingerprinting modules updated for new evasion techniques
