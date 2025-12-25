# InstaPump Architecture Analysis

## Overview

This document analyzes two fundamental approaches for building a filtered Instagram Reels experience:

1. **WebView Approach** - Embed Instagram web in a custom app shell
2. **Network Interception Approach** - Filter content at the network layer

---

## Table of Contents

- [WebView Approach](#webview-approach)
  - [How It Works](#how-it-works)
  - [Implementation Variants](#webview-implementation-variants)
  - [Pros & Cons](#webview-pros--cons)
  - [Platform Support](#webview-platform-support)
- [Network Interception Approach](#network-interception-approach)
  - [How It Works](#how-it-works-1)
  - [Implementation Variants](#network-implementation-variants)
  - [The Certificate Pinning Problem](#the-certificate-pinning-problem)
  - [Pros & Cons](#network-pros--cons)
- [Comparison Matrix](#comparison-matrix)
- [Filtering Strategies](#filtering-strategies)
- [Recommendation](#recommendation)

---

## WebView Approach

### How It Works

Embed Instagram's mobile web version inside a native WebView container (WKWebView on iOS, WebView on Android, or Electron for desktop). Inject custom CSS and JavaScript to:

1. Hide unwanted UI elements (buttons, navigation, overlays)
2. Detect the current content creator's username
3. Check against allowlist/blocklist
4. Auto-skip blocked content

```
┌─────────────────────────────────────┐
│         Native App Shell            │
│  ┌───────────────────────────────┐  │
│  │         WebView               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Instagram Mobile Web  │  │  │
│  │  │   + Injected CSS/JS     │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  [+] Approve  [-] Reject            │
└─────────────────────────────────────┘
```

### WebView Implementation Variants

| Variant | Platform | Technology | Notes |
|---------|----------|------------|-------|
| Electron App | Desktop (Mac/Win/Linux) | Chromium + Node.js | Current implementation |
| iOS Native | iOS | WKWebView + Swift | Can use `evaluateJavaScript()` |
| Android Native | Android | WebView + Kotlin/Java | Can use `evaluateJavascript()` |
| React Native | iOS + Android | react-native-webview | Cross-platform option |
| Flutter | iOS + Android | webview_flutter | Cross-platform option |

### WebView Pros & Cons

#### Pros

| Benefit | Description |
|---------|-------------|
| Full Control | Complete control over UI via CSS/JS injection |
| Privacy | All processing happens on-device |
| No Server Costs | No backend infrastructure needed |
| Simple Architecture | Straightforward to implement and debug |
| Cross-Platform Code | Same injection logic works across platforms |
| No Certificate Issues | Web traffic uses standard HTTPS |
| Quick Development | Fastest path to working prototype |

#### Cons

| Issue | Severity | Description | Workaround |
|-------|----------|-------------|------------|
| App Store Rejection | 🔴 High | Apple/Google reject WebView wrappers of major social apps | Sideloading only (TestFlight, AltStore, APK) |
| Login Detection | 🟡 Medium | Instagram may flag WebView logins as suspicious | Spoof user agent to match Safari/Chrome |
| No Push Notifications | 🟡 Medium | Cannot receive Instagram notifications | Users keep native app for notifications |
| Session Persistence | 🟡 Medium | Cookies may not persist reliably | Implement proper cookie storage |
| WebView Detection | 🟡 Medium | Instagram can detect and block WebViews | User agent spoofing |
| DOM Changes | 🔴 High | Instagram can change CSS classes anytime | Requires ongoing maintenance |
| Performance | 🟢 Low | Slightly worse than native | Acceptable for most users |
| Limited Features | 🟢 Low | No story/reel creation | Fine for consumption-only use case |

### WebView Platform Support

| Platform | Distribution Method | Difficulty | User Friction |
|----------|---------------------|------------|---------------|
| macOS | Direct download (.app) | 🟢 Easy | 🟢 Low |
| Windows | Direct download (.exe) | 🟢 Easy | 🟢 Low |
| Linux | Direct download (AppImage) | 🟢 Easy | 🟢 Low |
| Android | APK sideload | 🟢 Easy | 🟡 Medium (enable unknown sources) |
| iOS | TestFlight | 🟡 Medium | 🟡 Medium (100 user limit) |
| iOS | AltStore | 🟡 Medium | 🔴 High (refresh every 7 days) |
| iOS | Enterprise Certificate | 🔴 Hard | 🟢 Low (if you have one) |
| iOS | Jailbreak | 🔴 Hard | 🔴 High |

---

## Network Interception Approach

### How It Works

Intercept network traffic between Instagram's app and their servers. Parse API responses, identify content from blocked users, and either:
- Remove blocked content from responses
- Modify responses to skip blocked content
- Block specific API calls

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Instagram   │────▶│    Proxy/    │────▶│  Instagram   │
│  Native App  │◀────│    VPN       │◀────│   Servers    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────▼──────┐
                     │  Blocklist  │
                     │   Filter    │
                     └─────────────┘
```

### Network Implementation Variants

#### 1. Local Proxy (On-Device)

Run a proxy server locally on the device. Route Instagram traffic through it.

```
Device
├── Instagram App
├── Local Proxy Server (localhost:8080)
│   └── Filter Logic
└── VPN API (to redirect traffic)
```

| Aspect | Details |
|--------|---------|
| Privacy | ✅ Excellent - all on device |
| Complexity | 🔴 High |
| iOS Support | Requires VPN API or Network Extension |
| Android Support | Easier with VPNService API |
| Certificate Pinning | 🔴 Problem - needs bypass |

#### 2. VPN-based Filtering

Create a VPN app that routes traffic through your tunnel and filters it.

```
Device                          Server
├── Instagram App    ──────▶    VPN Server
└── VPN Client       ◀──────    └── Filter Logic
```

| Aspect | Details |
|--------|---------|
| Privacy | 🟡 Medium - traffic goes through your server |
| Complexity | 🟡 Medium |
| iOS Support | ✅ VPN apps allowed on App Store |
| Android Support | ✅ VPN apps allowed on Play Store |
| Certificate Pinning | 🔴 Problem - needs bypass |
| Server Costs | 💰 Scales with users |

#### 3. DNS-based Filtering

Use custom DNS to block or redirect requests.

| Aspect | Details |
|--------|---------|
| Privacy | ✅ Good |
| Complexity | 🟢 Easy |
| Filtering Capability | ❌ Too coarse - can only block domains, not filter content |
| **Verdict** | **Not suitable for this use case** |

#### 4. Router/Network Level

Run filtering proxy on home router or Raspberry Pi.

| Aspect | Details |
|--------|---------|
| Privacy | ✅ Excellent |
| Complexity | 🟡 Medium |
| Portability | ❌ Only works on home network |
| Mobile Data | ❌ Does not work |
| Certificate Pinning | 🔴 Problem |

#### 5. Cloud Proxy Service

Route all Instagram traffic through your cloud server.

| Aspect | Details |
|--------|---------|
| Privacy | 🔴 Poor - you see all user traffic |
| Complexity | 🟡 Medium |
| Server Costs | 💰💰 High - bandwidth intensive |
| Scalability | ✅ Good |
| Legal Risk | ⚠️ Handling user data |
| Certificate Pinning | 🔴 Problem |

#### 6. MITM with Custom CA

Install custom Certificate Authority on device to decrypt HTTPS.

| Aspect | Details |
|--------|---------|
| Control | ✅ Full visibility into traffic |
| Security Risk | 🔴 High - custom CA is dangerous |
| User Setup | 🔴 Very complex |
| Certificate Pinning | 🔴 Still blocked by Instagram |
| Requires | Jailbreak (iOS) or Root (Android) |

### The Certificate Pinning Problem

**This is the critical blocker for network interception.**

Instagram's native apps use **certificate pinning**, meaning they only trust Instagram's specific SSL certificates, not any proxy's certificate.

#### What is Certificate Pinning?

```
Normal HTTPS:
App ──▶ Trusts any valid CA ──▶ Server

Certificate Pinning:
App ──▶ Trusts ONLY Instagram's certificate ──▶ Server
    │
    └──▶ Rejects proxy certificate ❌
```

#### Bypass Methods

| Method | Platform | Requirements | Difficulty |
|--------|----------|--------------|------------|
| SSL Kill Switch | iOS | Jailbreak + Cydia | 🔴 High |
| Frida/Objection | iOS/Android | Jailbreak/Root | 🔴 High |
| Modified APK | Android | Decompile & rebuild | 🟡 Medium |
| Xposed Framework | Android | Root + Xposed | 🔴 High |
| Use Web Version | All | None (no pinning) | 🟢 None |

#### Key Insight

> **Instagram's web version does NOT use certificate pinning.**
> This is why the WebView approach works without any certificate issues.

### Network Pros & Cons

#### Pros

| Benefit | Description |
|---------|-------------|
| Native App Support | Works with Instagram's actual app |
| Complete Filtering | Can filter before content renders |
| No UI Injection | Don't need to maintain CSS selectors |
| Notifications Work | Native app means native notifications |

#### Cons

| Issue | Severity | Description |
|-------|----------|-------------|
| Certificate Pinning | 🔴 Critical | Blocks all interception without bypass |
| Jailbreak/Root Required | 🔴 High | Severely limits user base |
| Privacy Concerns | 🟡 Medium | VPN/proxy sees all traffic |
| Infrastructure Costs | 🟡 Medium | Servers, bandwidth |
| Complexity | 🔴 High | Much harder to implement |
| Instagram Updates | 🔴 High | API changes can break filtering |
| Legal Gray Area | 🟡 Medium | Modifying app traffic |

---

## Comparison Matrix

### Overall Comparison

| Factor | WebView | Network Interception |
|--------|---------|---------------------|
| Development Effort | 🟢 Low | 🔴 High |
| Works with Native App | ❌ No | ✅ Yes (with bypass) |
| Certificate Pinning | ✅ Not an issue | 🔴 Major blocker |
| App Store Distribution | ❌ No | 🟡 Maybe (VPN apps OK) |
| Privacy | ✅ Excellent | 🟡 Depends on approach |
| Server Costs | ✅ None | 💰 Medium-High |
| Maintenance | 🟡 DOM changes | 🟡 API changes |
| User Setup Complexity | 🟢 Low | 🔴 High |
| Push Notifications | ❌ No | ✅ Yes |
| User Base Potential | 🟡 Sideload users | 🔴 Jailbreak/root users |

### Feature Comparison

| Feature | WebView | Network (VPN) | Network (Local Proxy) |
|---------|---------|---------------|----------------------|
| Filter Reels | ✅ | ✅ | ✅ |
| Custom UI | ✅ | ❌ | ❌ |
| Hide Elements | ✅ | ❌ | ❌ |
| Works on Mobile Data | ✅ | ✅ | ✅ |
| Works on WiFi | ✅ | ✅ | ✅ |
| Battery Impact | 🟢 Low | 🟡 Medium | 🟡 Medium |
| Offline Blocklist | ✅ | ✅ | ✅ |
| Sync Blocklist | ✅ Can add | ✅ Built-in | ✅ Can add |

### Platform Feasibility

| Platform | WebView | Network (needs jailbreak/root) |
|----------|---------|-------------------------------|
| macOS | ✅ Easy | 🟡 Possible |
| Windows | ✅ Easy | 🟡 Possible |
| Linux | ✅ Easy | 🟡 Possible |
| Android (standard) | ✅ Easy (APK) | ❌ No |
| Android (rooted) | ✅ Easy | ✅ Yes |
| iOS (standard) | 🟡 TestFlight/AltStore | ❌ No |
| iOS (jailbroken) | ✅ Easy | ✅ Yes |

---

## Filtering Strategies

Regardless of approach chosen, here are the filtering strategies:

### Strategy 1: Polling + Auto-Skip

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Detect User │────▶│Check Block- │────▶│ Skip/Stay   │
│ (every Xms) │     │    list     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Pros:** Simple, reliable
- **Cons:** Brief flash of blocked content

### Strategy 2: Pre-hide + Reveal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Hide New    │────▶│ Detect User │────▶│Reveal/Skip  │
│  Content    │     │& Check List │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Pros:** No flash of blocked content
- **Cons:** Slight delay before content shows

### Strategy 3: MutationObserver

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ DOM Change  │────▶│ Detect User │────▶│ Skip/Stay   │
│  Detected   │     │& Check List │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Pros:** Event-driven, efficient
- **Cons:** More complex implementation

---

## Recommendation

### For This Project: WebView Approach

**Reasons:**

1. **Certificate pinning eliminates network interception** for standard (non-jailbroken) devices
2. **WebView is already working** in current Electron implementation
3. **Same code ports to mobile** with minimal changes
4. **Privacy-first** - no servers, no user data handling
5. **Fastest path to usable product**

### Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│                   InstaPump App                      │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  WebView    │  │  Blocklist  │  │  UI Shell   │  │
│  │  + Inject   │  │   Manager   │  │  Controls   │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  │
│         │                │                          │
│         ▼                ▼                          │
│  ┌─────────────────────────────────────────────┐   │
│  │           Filtering Engine                   │   │
│  │  • Username Detection                        │   │
│  │  • Blocklist Check                           │   │
│  │  • Auto-Skip Logic                           │   │
│  └─────────────────────────────────────────────┘   │
│                        │                            │
│                        ▼                            │
│  ┌─────────────────────────────────────────────┐   │
│  │           Persistent Storage                 │   │
│  │  • Allowlist                                 │   │
│  │  • Blocklist                                 │   │
│  │  • Settings                                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Development Roadmap

| Phase | Deliverable | Platform |
|-------|-------------|----------|
| 1 (Current) | Working Electron app | Desktop |
| 2 | Implement filtering | Desktop |
| 3 | Port to iOS (WKWebView) | iOS |
| 4 | Port to Android (WebView) | Android |
| 5 | Optional: Cloud blocklist sync | All |

### Future Consideration

If the user base grows significantly and there's demand for native app filtering:

1. Consider Android-only with modified APK (no root needed)
2. Partner with jailbreak community for iOS
3. Explore VPN approach for users who accept privacy tradeoff

---

## Distribution Strategies

The main challenge with the WebView approach is distribution. Here are legitimate paths that avoid sideloading and WebView blocking:

---

### Option 1: Browser Extension (Recommended)

Build a Chrome/Firefox/Safari extension that modifies Instagram.com when users browse it normally.

| Aspect | Details |
|--------|---------|
| Distribution | Chrome Web Store, Firefox Add-ons, Safari Extensions |
| App Store Allowed | ✅ Yes - extensions are legitimate |
| Sideloading | ❌ Not needed |
| WebView Blocking | ❌ Not an issue - uses real browser |
| iOS Support | ✅ Safari Web Extensions (iOS 15+) |
| Code Reuse | 90% same as current injection code |

**Why this works:**
- Users go to instagram.com in their browser
- Extension injects your CSS/JS
- Same filtering logic, legitimate distribution

**Extension Architecture:**
```
instapump-extension/
├── manifest.json          # Extension config
├── content.js             # Injected into Instagram (current code)
├── background.js          # Manages blocklist
├── popup.html             # Settings UI
├── popup.js               # Settings logic
└── styles.css             # Current HIDE_CSS
```

**Distribution Channels:**
| Store | Review Time | Cost |
|-------|-------------|------|
| Chrome Web Store | 1-3 days | Free |
| Firefox Add-ons | 1-3 days | Free |
| Safari Extensions (App Store) | 1-7 days | $99/year dev account |

---

### Option 2: Safari Web Extension (iOS Specific)

Apple allows Safari extensions on iOS since iOS 15. Distribute via App Store.

```
┌─────────────────────────────────────┐
│          App Store App              │
│  ┌───────────────────────────────┐  │
│  │    Safari Web Extension       │  │
│  │    (injected into Safari)     │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │    Settings/Blocklist UI      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

| Aspect | Details |
|--------|---------|
| App Store | ✅ Allowed |
| Rejection Risk | 🟢 Low - it's a browser extension |
| User Experience | User browses Instagram in Safari |
| Notifications | ❌ Still no push notifications |

---

### Option 3: Content Blocker (iOS)

iOS allows "Content Blocker" apps that filter Safari content. Distributed via App Store.

| Aspect | Details |
|--------|---------|
| App Store | ✅ Explicitly allowed category |
| Capabilities | Can hide elements, block requests |
| Limitation | ❌ Cannot inject JavaScript |
| Use Case | Can hide UI elements, but limited filtering logic |

**Verdict:** Too limited for dynamic filtering (can't detect username)

---

### Option 4: macOS App (Notarized)

Distribute macOS app directly, but notarize it with Apple.

| Aspect | Details |
|--------|---------|
| App Store | ❌ Not needed |
| Notarization | ✅ Apple notarizes, users can install without warnings |
| Distribution | Direct download from website |
| Cost | $99/year Apple Developer account |

---

### Option 5: Android Alternative Stores

Distribute on stores that allow more freedom than Google Play.

| Store | Allows WebView Apps | Reach |
|-------|---------------------|-------|
| F-Droid | ✅ Yes (open source) | Tech-savvy users |
| Amazon Appstore | 🟡 Maybe | Moderate |
| Samsung Galaxy Store | 🟡 Maybe | Samsung users |
| APKPure | ✅ Yes | International |
| Direct APK | ✅ Yes | Anyone |

---

### Distribution Comparison Matrix

| Approach | iOS | Android | Desktop | App Store OK | No Sideload | Effort |
|----------|-----|---------|---------|--------------|-------------|--------|
| Browser Extension | ✅ Safari | ✅ Chrome/Firefox | ✅ All | ✅ | ✅ | 🟡 Medium |
| Safari Web Extension | ✅ | ❌ | ❌ | ✅ | ✅ | 🟡 Medium |
| Content Blocker | ✅ | ❌ | ❌ | ✅ | ✅ | 🟢 Low |
| Notarized macOS | ❌ | ❌ | ✅ | N/A | ✅ | 🟢 Low |
| Alt Android Stores | ❌ | ✅ | ❌ | N/A | ✅ | 🟢 Low |
| Current WebView | 🟡 Sideload | 🟡 APK | ✅ | ❌ | ❌ | ✅ Done |

---

### Recommended Distribution Strategy

**Phase 1: Current (Development)**
- Electron app for desktop development
- Direct APK for Android testing
- TestFlight for iOS testing

**Phase 2: Browser Extension**
1. Build Chrome extension (reuse 90% of code)
2. Submit to Chrome Web Store
3. Port to Firefox Add-ons
4. Build Safari Web Extension for iOS

**Phase 3: Expand**
- Notarized macOS app for desktop users
- F-Droid for open-source Android distribution
- Safari extension on App Store for iOS

---

## Conclusion

The **WebView approach** is the clear winner for this project because:

- ✅ Works today without jailbreak/root
- ✅ Avoids the certificate pinning problem entirely
- ✅ Simple to implement and maintain
- ✅ Privacy-preserving (no servers)
- ✅ Cross-platform with same core logic

**For distribution**, the **Browser Extension** path is recommended because:

- ✅ Legitimate App Store/Web Store distribution
- ✅ No sideloading required
- ✅ No WebView blocking issues
- ✅ Same injection code works directly
- ✅ Covers iOS (Safari), Android (Chrome), and Desktop

---

*Document generated: December 2024*
*Project: InstaPump - Filtered Instagram Reels Experience*
