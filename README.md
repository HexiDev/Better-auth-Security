# Better-Auth Security Plugin

A security-focused plugin for [better-auth](https://www.better-auth.com/) built with TypeScript and Bun runtime, providing enhanced authentication security features.

## About

This plugin extends better-auth with additional security capabilities, focusing on device fingerprinting and fraud prevention. Built with TypeScript for type safety and Bun for optimal performance.

## Features

### 📱 Fingerprint Package

Advanced device fingerprinting capabilities for enhanced authentication security. Tracks device characteristics, detects suspicious behavior, and helps prevent account takeover attacks.

**[📖 View detailed Fingerprint documentation →](./docs/fingerprint.md)**

Key capabilities:

- **Device Fingerprinting**: Collects unique device characteristics for identification
- **Spoofing Detection**: Advanced lie detection system to identify fake browser data
- **Trust Scoring**: Calculates device authenticity scores based on multiple signals
- **Suspicious Activity Monitoring**: Tracks and flags unusual authentication patterns
- **Custom Module System**: Extensible architecture for custom fingerprinting techniques

## Quick Start

### Installation

```bash
# npm
npm install better-auth-security

# yarn
yarn add better-auth-security

# pnpm
pnpm add better-auth-security

# bun
bun add better-auth-security
```

### Basic Setup

**Server (auth.ts)**

```typescript
import { betterAuth } from "better-auth";
import { fingerprint } from "better-auth-security/fingerprint";

export const auth = betterAuth({
  plugins: [
    fingerprint({
      endpoints: ["/sign-in/email", "/sign-up/email"],
      suspiciousThresholds: {
        accountsPerFingerprint: 3,
        fingerprintsPerAccount: 5,
      },
    }),
  ],
});
```

**Client**

```typescript
import { createAuthClient } from "better-auth/client";
import { fingerprintClient } from "better-auth-security/fingerprint/client";

export const authClient = createAuthClient({
  plugins: [fingerprintClient()],
});
```

## Security Features

### Automatic Protection

The plugin automatically integrates with your authentication flow to:

- ✅ **Detect automated attacks** - Identifies bots and headless browsers
- ✅ **Prevent account takeover** - Links devices to user accounts
- ✅ **Flag suspicious activity** - Monitors unusual authentication patterns
- ✅ **Generate trust scores** - Calculates device authenticity ratings
- ✅ **Customizable thresholds** - Configure security sensitivity levels

### Advanced Detection

Built-in detection for:

- **Browser spoofing** - Mismatched WebGL vendor/renderer pairs
- **Headless browsers** - Missing extensions and unusual configurations
- **Virtual machines** - Specific graphics drivers and hardware signatures
- **Multiple accounts** - Same device used across many accounts

## Important Security Notice

⚠️ **This plugin requires custom fingerprinting modules for production use.**

The built-in modules (screen and WebGL) are basic examples. Effective fingerprinting requires extensive browser data collection that must be implemented based on your specific security requirements.

**[📖 Learn how to build effective fingerprinting modules →](./docs/fingerprint.md#building-effective-modules)**

## Documentation

- **[📖 Fingerprint Plugin Documentation](./docs/fingerprint.md)** - Complete implementation guide
- **[🔧 Configuration Options](./docs/fingerprint.md#configuration-options)** - Server and client setup
- **[🛡️ How Fingerprinting Works](./docs/fingerprint.md#how-fingerprinting-works)** - Technical deep dive
- **[📚 Fingerprinting Resources](./docs/fingerprint.md#fingerprinting-resources)** - Research and learning materials

## Roadmap

Future security features planned:

- **Rate Limiting Plugin** - Advanced request throttling with suspicious pattern detection
- **Geolocation Security** - IP-based risk assessment and impossible travel detection
- **Session Security** - Enhanced session management with device binding
- **Behavioral Analysis** - Mouse movement and typing pattern analysis
- **Risk Assessment API** - Unified risk scoring across all security plugins

## Contributing

We welcome contributions! Whether you're:

- Building custom fingerprinting modules
- Improving detection algorithms
- Adding new security features
- Reporting security vulnerabilities

Please see our contributing guidelines and security policy.

## License

MIT License - see LICENSE file for details.
