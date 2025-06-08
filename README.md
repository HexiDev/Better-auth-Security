[!WARNING] > **🚧 Work in Progress - Not Ready for Production**

This plugin is currently under active development and **does not yet work**. Features described in this documentation are planned but not yet (fully) implemented. Please do not yet use this.

- ❌ Core functionality not yet complete
- ❌ API may change significantly
- ❌ No stable release available

**Star this repo** to be notified when the first stable version is released!

# Better-Auth Security Plugin

![Better Auth Security Banner](./assets/banner/blue2.png)

A security-focused plugin for [better-auth](https://www.better-auth.com/) built with TypeScript and Bun runtime, providing enhanced authentication security features.

## About

This plugin extends better-auth with additional security capabilities, focusing on device fingerprinting and fraud prevention. Built with TypeScript for type safety and Bun for optimal performance.

## Features

### 📱 Fingerprint Package

Advanced device fingerprinting capabilities for enhanced authentication security. Tracks device characteristics, detects suspicious behavior, and helps prevent account takeover attacks.

**[📖 View detailed Fingerprint documentation →](./docs/fingerprint.md)**

Key capabilities:

- **Device Fingerprinting**: Collects unique device characteristics for identification

**More coming soon!**

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

## Important Security Notice

⚠️ **This plugin requires custom fingerprinting modules for production use.**

The built-in modules (screen and WebGL) are basic examples. Effective fingerprinting requires extensive browser data collection that must be implemented based on your specific security requirements.

**[📖 Learn how to build effective fingerprinting modules →](./docs/fingerprint.md#building-effective-modules)**

## Documentation

### 📖 Plugin Documentation

- **[📱 Fingerprint Plugin](./docs/fingerprint.md)** - Advanced device fingerprinting and spoofing detection
  - [Installation & Setup](./docs/fingerprint.md#installation)
  - [Configuration Options](./docs/fingerprint.md#configuration-options)
  - [How Fingerprinting Works](./docs/fingerprint.md#how-fingerprinting-works)
  - [Building Custom Modules](./docs/fingerprint.md#building-effective-modules)
  - [Resources & Research](./docs/fingerprint.md#fingerprinting-resources)

## Roadmap

Future security features planned:

### 🛡️ Core Security Plugins

- **CSRF Protection Plugin** - Advanced Cross-Site Request Forgery protection with token rotation
- **Session Security Plugin** - Enhanced session management with device binding, concurrent session limits, and session hijacking detection

### 🌐 Network & Location Security

- **Geolocation Security Plugin** - IP-based risk assessment, impossible travel detection, and VPN/proxy identification
- **Network Anomaly Detection** - Monitor for unusual connection patterns, distributed attacks, and coordinated bot activity

### 📊 Monitoring & Response

- **Automated Incident Response** - Configurable response actions for detected threats (account lockout, admin alerts, etc.)
- **Audit Logging Plugin** - Comprehensive security event logging

## Contributing

We welcome contributions! Whether you're:

- Building custom fingerprinting modules
- Improving detection algorithms
- Adding new security features
- Reporting security vulnerabilities

## License

MIT License - see LICENSE file for details.
