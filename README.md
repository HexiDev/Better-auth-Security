# Better-Auth Security Plugin

A security-focused plugin for [better-auth](https://www.better-auth.com/) built with TypeScript and Bun runtime, providing enhanced authentication security features.

## About

This plugin extends better-auth with additional security capabilities, focusing on device fingerprinting and fraud prevention. Built with TypeScript for type safety and Bun for optimal performance.

## Features

### 📱 Fingerprint Package

The Fingerprint plugin provides advanced device fingerprinting capabilities for enhanced authentication security. It tracks device characteristics, detects suspicious behavior, and helps prevent account takeover attacks through client-side and server-side fingerprint analysis.

## Installation

### Install the Package

First, install the security plugin package:

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

## How Fingerprinting Works

The fingerprint plugin uses a sophisticated module system to detect device authenticity and prevent spoofing attempts. Here's how it works:

### Module Architecture

The plugin operates with two types of modules:

1. **Client Modules**: Collect device characteristics in the browser
2. **Server Modules**: Validate the collected data for inconsistencies

### Data Collection Process

1. **Client-Side Collection**: When a user attempts to authenticate, client modules gather device information:

   ```typescript
   // Screen module collects display data
   {
     width: 1920,
     height: 1080,
     devicePixelRatio: 2,
     availWidth: 1920,
     availHeight: 1040
   }

   // WebGL module captures graphics info
   {
     vendor: "Intel Inc.",
     renderer: "Intel(R) UHD Graphics 620"
   }
   ```

2. **Data Transmission**: Collected data is base64-encoded and sent via the `X-Data` header
3. **Server-Side Validation**: Server modules analyze the data for inconsistencies

### Lie Detection System

Each server module implements an `isLying()` function that returns `true` if the data appears spoofed:

#### Screen Module Detection

```typescript
// Detects impossible screen configurations
async isLying(ctx) {
  const { width, height, availWidth, availHeight, devicePixelRatio } = ctx;

  // Available size cannot exceed total size
  if (availWidth > width || availHeight > height) return true;

  // Suspiciously small screens
  if (width < 300 || height < 300) return true;

  // Invalid pixel ratios
  if (devicePixelRatio < 0.5 || devicePixelRatio > 10) return true;

  return false;
}
```

#### WebGL Module Detection

```typescript
// Detects mismatched vendor/renderer pairs
async isLying(ctx) {
  const { renderer, vendor } = ctx;

  // NVIDIA vendor should have NVIDIA in renderer
  if (vendor.includes('nvidia') && !renderer.includes('nvidia')) return true;

  // Intel vendor should have Intel in renderer
  if (vendor.includes('intel') && !renderer.includes('intel')) return true;

  return false;
}
```

### Weight System

Each module has a weight that determines its importance in the trust score calculation:

```typescript
const modules = [
  { id: "webgl", weight: 50 }, // WebGL is harder to spoof
  { id: "screen", weight: 40 }, // Screen data is easier to fake
  { id: "fonts", weight: 30 }, // Font data is moderately reliable
];
```

### Trust Score Calculation

The trust score is calculated based on which modules detect lies:

1. **Total Weight**: Sum of all module weights (e.g., 50 + 40 + 30 = 120)
2. **Truthful Weight**: Sum of weights from modules that don't detect lies
3. **Trust Score**: `(Truthful Weight / Total Weight) × 100`

#### Example Calculation

```typescript
// All modules pass (no lies detected)
trustScore = (50 + 40 + 30) / 120 × 100 = 100%

// WebGL module detects lie (screen and fonts pass)
trustScore = (40 + 30) / 120 × 100 = 58.3%

// All modules detect lies
trustScore = 0 / 120 × 100 = 0%
```

### Real-World Example

```typescript
// User with legitimate Firefox browser
Client Data: {
  screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
  webgl: { vendor: "Mozilla", renderer: "Mozilla -- ANGLE (Intel)" }
}

Server Analysis:
✅ Screen: Normal desktop resolution, valid pixel ratio
✅ WebGL: Mozilla vendor matches ANGLE renderer
Trust Score: 100%

// Automated bot with spoofed data
Client Data: {
  screen: { width: 1920, height: 1080, devicePixelRatio: 1 },
  webgl: { vendor: "NVIDIA Corporation", renderer: "Intel UHD Graphics" }
}

Server Analysis:
✅ Screen: Valid configuration
❌ WebGL: NVIDIA vendor but Intel renderer (impossible)
Trust Score: 40% (only screen module passed)
```

### Advanced Detection Techniques

The plugin can detect various spoofing attempts:

- **Headless Browsers**: Missing WebGL extensions or unusual configurations
- **Browser Automation**: Inconsistent user agent vs. actual capabilities
- **Virtual Machines**: Specific graphics drivers or unusual hardware combinations
- **Proxy/VPN Detection**: IP geolocation vs. timezone/language mismatches

### Module Development

When creating custom modules, consider:

1. **Weight Assignment**: Higher weights for harder-to-spoof characteristics
2. **False Positive Rate**: Balance security with legitimate user experience
3. **Performance**: Keep validation logic fast and efficient
4. **Privacy**: Only collect non-personally identifiable characteristics

## Important Disclaimer

⚠️ **This plugin is designed for you to bring your own fingerprinting modules.**

The built-in modules (screen and WebGL) are basic examples and **should not be relied upon for production security**. Effective fingerprinting requires extensive browser information that cannot be obtained from HTTP requests alone.

### The Reality of Fingerprinting

Fingerprinting is fundamentally about **abscurity over security**. The goal is not to create an unbreakable system, but to make bypassing your defenses so difficult and time-consuming that attackers give up and move to easier targets.

Key principles:

- **Layer multiple detection methods** - No single fingerprint technique is foolproof
- **Make it economically unfeasible** - The effort to bypass should exceed the value gained
- **Accept some false positives** - Perfect accuracy isn't the goal; raising the bar is
- **Continuous evolution** - Attackers adapt, so your defenses must too

### Building Effective Modules

To create robust fingerprinting, you need modules that collect:

- **Canvas fingerprinting** - Render text/graphics and hash the output
- **Audio fingerprinting** - Analyze audio processing variations
- **Hardware signatures** - GPU rendering differences, CPU timing
- **Behavioral patterns** - Mouse movements, typing cadence, scroll patterns
- **Browser inconsistencies** - Feature support mismatches, timing variations
- **Font enumeration** - Available fonts reveal OS/browser details
- **WebRTC signatures** - Network interfaces and media capabilities

## Fingerprinting Resources

Learn from the experts and existing implementations:

### 📚 Essential Reading

- **[CreepJS](https://github.com/abrahamjuliot/creepjs)** - Comprehensive browser fingerprinting library showcasing dozens of detection techniques
- **[FingerprintJS](https://dev.fingerprint.com/)** - Commercial-grade fingerprinting with extensive documentation on evasion techniques

### 🔬 Research & Techniques

- **[Device Fingerprinting Techniques](https://pixelprivacy.com/resources/browser-fingerprinting/)** - Overview of various fingerprinting methods
- **[Canvas Fingerprinting](https://browserleaks.com/canvas)** - Test your browser's canvas signature
- **[WebGL Fingerprinting](https://browserleaks.com/webgl)** - Graphics-based identification techniques
- **[Audio Fingerprinting Research](https://audiofingerprint.openwpm.com/)** - Academic research on audio-based fingerprinting

### 🎯 Module Development Tips

1. **Study evasion techniques** - Understand how attackers bypass detection
2. **Test across devices** - Ensure your modules work on various platforms
3. **Monitor false positive rates** - Balance security with user experience
4. **Use multiple data sources** - Combine hardware, software, and behavioral signals
5. **Implement fallbacks** - Gracefully handle missing browser features
6. **Consider privacy** - Only collect necessary, non-PII data

Remember: The most effective fingerprinting combines multiple weak signals into a strong identification system. No single technique is sufficient on its own.
