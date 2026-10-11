# Passkey Support for ZeroVault: Feasibility Study and Technical Design

- Project: ZeroVault (zero-knowledge password manager, TFM deliverable)
- Document type: design and feasibility study (no production code)
- Written: 2026-10-12. TFM deadline: 2026-10-26 (14 calendar days).
- Scope of the system studied: `apps/web` (Vite/React), `apps/api` (Express/Prisma), `packages/crypto`, `packages/shared-types`, `apps/extension` (Chrome MV3).

## How to read this document

Every material external claim carries a bracketed reference such as [S3], resolved in the Sources section. Claims are labelled:

- **Verified**: read in a primary or vendor source during this study (the reference is given).
- **Inferred**: a design conclusion drawn by the author from verified facts and from reading the ZeroVault code. It is not stated by any source.
- **Unverified**: could not be confirmed with the tools available. These are collected again in section 10.

Statements about ZeroVault itself come from reading `packages/crypto/src/index.ts`, `apps/web/src/vault/vault-entry.ts`, `apps/web/src/vault/vault-service.ts`, `apps/extension/src/background/session.ts` and `odd/tasks/zerovault-extension.md`.

---

## 1. Executive summary and feasibility verdict

Passkeys cannot be "stored" in ZeroVault the way a password or a TOTP seed is stored. A passkey is a private key that a WebAuthn authenticator generates and is expected never to reveal [S2]. To support passkeys, ZeroVault would have to become a software authenticator (a "passkey provider"): it would generate key pairs, answer `navigator.credentials.create()` and `navigator.credentials.get()` calls, build the authenticator data and sign challenges.

Findings, in short:

1. **No browser offers a clean, supported API for a Chrome desktop extension to act as a passkey provider alongside the native one.** Bitwarden's own contributor documentation states that no such browser API exists and that an extension must replace the native implementation by overriding `navigator.credentials.create` and `navigator.credentials.get` in the page [S3]. The only first-party extension API that touches WebAuthn, `chrome.webAuthenticationProxy`, is designed for remote desktop software and suspends normal WebAuthn processing for the whole browser while attached [S1].
2. **Platform-level provider APIs exist (Android 14+, iOS 17+, Windows 11 plugin model) but require native apps** [S5][S10][S8]. A web app and a Chrome extension cannot use them. They are outside what a student project with a two-week window can deliver.
3. **The zero-knowledge model transfers well.** ZeroVault's existing vault items are opaque AES-256-GCM blobs; a passkey record can live inside such a blob with no API or schema change on the server. The server would learn only what it already learns about items (existence, size, timestamps). *(Inferred from the code reading in section 5.)*
4. **The security trade-off is real.** Today a vault compromise leaks passwords. With passkeys held as software keys, a vault compromise (or a flaw in the extension's origin checks) would also leak keys that were designed to be unclonable and phishing-resistant.

### Feasibility verdict

> **Conditionally feasible as a bounded proof of concept (Chrome desktop, extension-only, software authenticator with ES256 and "none" attestation, demonstrated against a test relying party); not feasible within the TFM window as a complete, production-grade passkey provider, and not feasible at all for mobile or OS-native integration.**

Recommendation for the thesis: implement and demonstrate at most phases 0 to 2 (section 7), present the architecture, the zero-knowledge analysis and the threat model as the contribution, and document everything else as future work (section 9). A reduced alternative scope, using passkeys as a way to *log in to* ZeroVault itself, is discussed in section 8.

---

## 2. What a passkey is, and why it differs from passwords and TOTP

### 2.1 Definition

A passkey is a WebAuthn **discoverable credential**: a public-key credential that the authenticator stores so that a relying party (RP) can start sign-in without first supplying a credential ID (an empty `allowCredentials` list) [S2]. Passkeys.dev gives the practical vocabulary [S14]:

- **Synced passkey**: a discoverable credential made available on several devices through sync, backup restore or cross-device authentication.
- **Device-bound passkey**: a discoverable credential bound to a single authenticator, typically a security key.
- **Passkey provider**: an app or service responsible for storing and managing passkeys.

At registration the client creates a key pair. The public key goes to the RP; the private key stays with the authenticator. At sign-in the authenticator signs a server challenge together with data that binds the signature to the RP's identifier and to the origin that the browser observed [S2][S7].

### 2.2 Why this is not a "stored secret"

| Property | Password | TOTP seed | Passkey |
|---|---|---|---|
| What the RP holds | hash of the secret | the shared secret itself | public key only |
| What the user/manager holds | the secret string | the same shared secret | private key (asymmetric) |
| Can be copied into a vault as text | yes | yes (ZeroVault already does: `VaultEntry.totp`) | by design, no |
| Who computes the proof | the user, by typing | the manager, from the seed and the clock | the authenticator, by signing a challenge |
| Origin binding | none (user judgement) | none | enforced by browser/authenticator via the RP ID |
| Breach of the RP database | leaks hash | leaks all seeds | leaks only public keys |

The WebAuthn specification says the credential private key is bound to its managing authenticator and "is expected to never be exposed to any other party, not even to the owner of the authenticator" [S2]. Passkeys.dev likewise states that device-bound credentials "cannot leave the device" and that for discoverable credentials the private key is stored entirely in the authenticator [S14]. Synced passkeys exist because some authenticators (the platform credential managers) are *themselves* the sync mechanism; the key is not exposed to the user, it is replicated between instances of the same manager [S14].

Two flags in the authenticator data record this [S2]:

- **BE (backup eligible)**: set at creation and permanent. A credential with BE=1 is a *multi-device credential*.
- **BS (backup state)**: reports whether the credential is currently backed up; it can change over time.

### 2.3 Consequence for ZeroVault

"Storing a passkey" in ZeroVault therefore means **ZeroVault becomes the authenticator**: it creates the key pair at registration, keeps the private key, and signs at authentication. An RP that checks the authenticator type will see ZeroVault, not a hardware key or a platform authenticator. A password manager cannot import a passkey created elsewhere unless the originating provider chooses to export it, which is the purpose of the FIDO credential-exchange drafts discussed in section 4.4.

---

## 3. API landscape for acting as a passkey provider

### 3.1 Summary matrix

| Environment | Mechanism | Usable by ZeroVault today? | Source |
|---|---|---|---|
| Chrome desktop, MV3 extension | Override `navigator.credentials.*` in the page (MAIN world script) | Yes, technically; unsupported by the browser, fragile | [S3][S12] |
| Chrome desktop, MV3 extension | `chrome.webAuthenticationProxy` | Technically possible; designed for remote desktop; exclusive and global | [S1] |
| Android 14+ (incl. Chrome for Android) | `CredentialProviderService` (Credential Manager) | No: needs a native Android app | [S5][S6] |
| iOS 17+ / macOS | Credential Provider Extension (`ASCredentialProviderViewController`) | No: needs a native app | [S10] |
| Windows 11 (24H2 and later) | WebAuthn plugin authenticator (COM server) | No: needs a native app | [S8][S16] |
| Web app only (no extension) | none | No: a web page cannot register as an authenticator | inferred |

### 3.2 `chrome.webAuthenticationProxy`

**Verified facts [S1]:**

- Available from Chrome 115, Manifest V3 and later; requires the `webAuthenticationProxy` permission.
- Stated purpose: "remote desktop software on a remote host intercept[s] WebAuthn requests and handle[s] them on a local client".
- `attach()` makes the extension the active proxy. Once it returns without error, "regular processing of WebAuthn requests is suspended".
- Events `onCreateRequest`, `onGetRequest` and `onIsUvpaaRequest` deliver the requests; the extension must answer every one through `completeCreateRequest()`, `completeGetRequest()` or `completeIsUvpaaRequest()`. Requests are exchanged as JSON compatible with `parse...FromJSON()` and `toJSON()`.
- `onRequestCanceled` fires on abort or timeout; a canceled request can no longer be completed.
- Only one extension can be attached at a time; `attach()` fails if another extension already is.
- `onRemoteSessionStateChange` is driven by a *native companion application* that writes an empty file named after the extension ID into a `WebAuthenticationProxyRemoteSessionStateChange` directory in the default user data directory. The listener must be registered synchronously at load time.

**Inferred consequences for ZeroVault:**

- Attaching would take over *every* WebAuthn request in the browser profile, including those from users who keep passkeys in Google Password Manager, a platform authenticator or a security key. Because regular processing is suspended, ZeroVault would have to answer or reject all of them, with no documented way to hand a request back to the native stack. This is a poor fit for a password manager that should only serve credentials it holds.
- Exclusivity means ZeroVault would conflict with any remote-desktop tool using the same API.
- The API gives clean, structured requests and a structured completion path, which is attractive for a prototype and avoids page-world script injection. Request origin information is part of the request data; I did **not** verify which fields (for example, the effective origin of cross-origin iframes) are supplied.
- **Unverified:** whether `attach()` is permitted without the native companion (the documentation describes the companion only for `onRemoteSessionStateChange`), and whether the Chrome Web Store would accept a non-remote-desktop use of this permission. Either could block a public release; neither blocks a load-unpacked demo.

### 3.3 Page-world interception (the technique Bitwarden uses)

**Verified [S3]:** Bitwarden's contributor documentation says there are currently no browser APIs that let extensions provide passkeys alongside the native implementation, so an extension must completely replace it. It injects a script into the page that reassigns `navigator.credentials.create` and `navigator.credentials.get`, keeps references to the native functions beforehand, and can fall back to the native implementation if the user declines Bitwarden. This also avoids re-implementing hardware keys and hybrid (caBLE) transports. The same page states that user presence is always required and that user verification is not yet fully supported. The page does not say whether the injected script is a content script or a main-world script (this was reported as not covered by the page).

**Verified [S12]:** `chrome.scripting` supports an `ExecutionWorld` of `MAIN` ("the execution environment shared with the host page's JavaScript") and `ISOLATED`; `RegisteredContentScript.world` exists from Chrome 102. A statically declared content script with `"world": "MAIN"` is therefore the available mechanism for patching `navigator.credentials` in the page (the manifest key itself was not separately fetched; treat the exact manifest syntax as to-be-checked during implementation).

**Inferred design constraints:**

1. A main-world script is visible to, and replaceable by, page JavaScript. It must therefore be a thin shim that carries no secret and makes no security decision; all decisions (origin, rpId validity, user consent, signing) belong in the extension's background context.
2. The shim talks to an isolated-world content script through `window.postMessage` or `CustomEvent`, and the content script relays to the background. The page can forge such messages, so the background must derive the request origin from `sender` (`sender.url`, `sender.frameId`, tab and frame information) and never from message fields.
3. Timing: the shim must be installed at `document_start` before page code reads `navigator.credentials`. Bitwarden's page does not discuss iframes, CSP or timing [S3]; these are open implementation risks for ZeroVault.
4. Fallback to the native implementation is possible in this model, which is a significant advantage over the proxy API (the proxy suspends native processing [S1]).

### 3.4 Android Credential Manager

**Verified [S5]:** Android 14 (API 34) and later. A provider is a service extending `CredentialProviderService`, bound with `android.permission.BIND_CREDENTIAL_PROVIDER_SERVICE`, declaring `androidx.credentials.TYPE_PUBLIC_KEY_CREDENTIAL`. The interaction has a begin/query phase and a selection phase launched through `PendingIntent`s. The provider validates the request, shows a biometric prompt, generates a secp256r1 key pair, stores the private key (the guide says passkey private keys must be encrypted at rest), builds the WebAuthn attestation JSON and returns it. Browsers act on behalf of RPs, so the provider receives an `origin` only for callers in a privileged-apps allowlist; Google Password Manager uses a public allowlist, and third-party providers are told to consult their own documentation.

**Verified [S6]:** Chrome on Android 14+ uses Credential Manager, so passkeys from enabled third-party managers can be used; Google Password Manager remains the default; the page dates from 2024-08-05, and notes the update may not appear on some OEM devices.

**Inferred:** this is the cleanest provider model in the landscape, but it needs a native Kotlin/Java app, device testing, and (for browser callers) allowlist considerations. It is not reachable from the existing TypeScript codebase.

### 3.5 Apple platforms

**Partially verified.** Apple's own documentation pages could not be retrieved with the available tools (one returned HTTP 404, another only a title). Search-result summaries of Apple's tutorial and developer forum threads report [S10]:

- A Credential Provider Extension subclasses `ASCredentialProviderViewController`; the extension and its containing app need the AutoFill credential provider entitlement.
- `ASPasskeyCredentialIdentity` instances can be added to the shared `ASCredentialIdentityStore` so they appear in AutoFill suggestions.
- One forum thread reports that passkey registration was offered only after the extension's `Info.plist` declared `ASCredentialProviderExtensionCapabilities` with `ProvidesPasskeys = YES`.
- The `iOS 17` minimum used by Bitwarden and 1Password for saving passkeys is corroborated by [S4].

Confidence is moderate for these points; they would need confirmation against Apple's current reference before being relied on in the thesis.

### 3.6 Windows 11

**Verified [S7]:** Windows 11 22H2 with KB5030310 has a native passkey management experience; since 24H2 users are prompted for privacy consent before applications can access passkeys (Settings, Privacy and security, Passkey access).

**Verified [S8]:** Microsoft's "Passkey Manager" sample shows how a third-party manager integrates through the WebAuthn plugin APIs: a COM object registered in the registry implementing `IPluginAuthenticator`, registration with `WebAuthNPluginAddAuthenticator`, user verification via Windows Hello with `WebAuthNPluginPerformUv`, and a Windows SDK version of 10.0.26100.1742 or higher.

**Reported by secondary sources only [S16]:** general availability with the November 2025 security update, with 1Password and Bitwarden among the first plugin providers. The official Microsoft Learn page on MSIX packaging requirements for plugins was not found; packaging details came only from a third-party KeePass project and are not relied upon here.

**Inferred:** another native-app route; out of reach for the TFM.

### 3.7 What is and is not possible from "Chrome MV3 extension plus web app"

| Capability | Possible? | Notes |
|---|---|---|
| Intercept `create()`/`get()` on arbitrary sites | Yes, via main-world shim [S3][S12] or proxy API [S1] | Unsupported by browser vendors in the shim case |
| Generate P-256 keys and sign in the extension | Yes | Web Crypto supports ECDSA P-256 (author's knowledge; not source-checked) |
| Provide user verification (biometric/PIN) | Not in the platform sense | Bitwarden itself does not yet fully support UV [S3]. ZeroVault could re-use master-password re-entry or a short idle window; this is a weaker assurance than a device biometric. *(Inferred.)* |
| Serve passkeys on mobile | No | Needs native providers [S5][S10] |
| Appear in the OS-native passkey picker | No | Needs platform plug-in [S8] |
| Coexist with native providers without a conflict | Only with the shim approach, using native fallback [S3] | Proxy approach is exclusive [S1] |
| Make the web app a provider | No | A page cannot register as an authenticator *(inferred)* |

---

## 4. How existing managers provide and sync passkeys

### 4.1 Bitwarden

**Verified:**

- Passkeys are stored in the vault, "protected with Bitwarden's trusted end-to-end encryption", and available from any Bitwarden app. One passkey per login item. A master-password re-prompt setting protects access to a login item's passkey. Passkeys are included in Bitwarden JSON exports. On mobile, Bitwarden supports FIDO Credential Exchange (CXP) import and export on iOS 26+ and Android 14+. Saving passkeys requires iOS 17+ or Android 14+. [S4]
- On Android, Bitwarden-stored passkeys work only as a primary login credential, not for passkey-based 2FA (non-discoverable credentials). [S4]
- Browser extension: page-world replacement of `navigator.credentials.*`, a client-side `discoverable` flag in the passkey metadata, a `userHandle` returned when available, user presence always required, user verification not yet fully supported. [S3]

### 4.2 1Password

**Verified [S9]:**

- Passkeys are saved as items, which can be viewed, edited, moved and shared like other items; saving offers to add the passkey to an existing Login or create a new item.
- Deleting a passkey in 1Password does not delete it at the website.
- Passkey export is available only in 1Password for iOS and Android; exporting from desktop apps requires recreating each passkey and storing the new ones elsewhere.
- Business administrators can control whether team members can save or use passkeys in the browser.
- The page does not explain how passkeys sync, and its availability notices are inconsistent about browser versus Safari support, so the platform list was not taken from it.

**Reported by secondary sources [S16]:** first-party Windows 11 plugin support at general availability.

### 4.3 What is out of reach for a student project

| Capability | Why it is out of reach |
|---|---|
| Native Android/iOS credential providers | Separate native codebases and device testing; entitlements and platform review [S5][S10] |
| Windows 11 plugin authenticator | Native COM/MSIX component, Windows SDK 10.0.26100.1742+, Windows Hello integration [S8] |
| Reliable user verification | Needs platform biometric APIs; even Bitwarden's extension lacks full UV [S3] |
| Cross-device hybrid (caBLE) transport and security-key support | Bitwarden avoids it by falling back to the native stack [S3] |
| RP compatibility at scale (non-discoverable credentials, extensions such as PRF, related origins) | Long tail of RP behaviours; PRF support varies per manager and platform even among mature managers [S13] |
| Attestation | Not needed for consumer RPs; "none" attestation is the realistic choice *(inferred)* |
| Cross-provider portability | Depends on FIDO CXP/CXF, still described as working drafts (section 4.4) |

### 4.4 Portability: FIDO Credential Exchange

The FIDO Alliance's Credential Exchange Protocol (CXP) and Credential Exchange Format (CXF) define how credentials, including passkeys, move between providers. The version retrieved was a **Working Draft dated 2024-10-03**, not intended for implementation [S11]. Bitwarden's help page indicates a production use on mobile [S4], but I could not confirm the current status of the specification itself as of October 2026. For ZeroVault, CXP/CXF is relevant only as future work: it defines the exit path a user would eventually need.

---

## 5. Zero-knowledge implications

### 5.1 What exists today (read from the code)

- `packages/crypto/src/index.ts`: PBKDF2-SHA-256 with 600,000 iterations derives a **non-extractable** AES-256-GCM key (`deriveEncryptionKey`). A separate salt derives the auth hash sent to the server (`deriveAuthHash`). `encrypt(key, plaintext: string)` returns `{ ciphertext, iv }` with a fresh 96-bit random IV; `decrypt` rejects on a wrong key or tampering.
- `apps/web/src/vault/vault-entry.ts`: `VaultEntry` is `{ site, username, password, totp?, tags? }`, serialised with `JSON.stringify` and encrypted as a whole by `vault-service.ts`. The API only ever receives `{ ciphertext, iv }`.
- `apps/extension/src/background/session.ts`: login derives the key, fetches `/vault`, decrypts every row into an in-memory `Session { email, token, key, items }`. The key is never persisted; a worker restart or the idle timeout (default 15 minutes) drops the session. Undecryptable items are skipped.

### 5.2 Proposed storage model (inferred design)

A passkey becomes a new variant of the encrypted blob; the server schema and routes do not change.

```
VaultEntry (existing, kind implicit = "login")
PasskeyEntry (new, kind = "passkey")
  kind:            "passkey"
  rpId:            string          // e.g. "example.com"
  rpName:          string
  credentialId:    base64url       // random, >= 16 bytes
  userHandle:      base64url       // supplied by the RP at create()
  userName:        string
  userDisplayName: string
  privateKey:      base64 (PKCS#8, ECDSA P-256)
  publicKey:       base64 (SPKI) or COSE key
  discoverable:    boolean         // cf. Bitwarden's client-side flag [S3]
  signCount:       number          // fixed at 0 (see 5.4)
  createdAt, lastUsedAt: ISO timestamps
```

Practical notes:

- The key pair must be generated **extractable** so that the private key can be exported to PKCS#8 and placed in the encrypted blob. It is re-imported as a **non-extractable** `CryptoKey` for each signing operation and discarded afterwards. This is the one place where the model deliberately departs from the "non-extractable everywhere" posture of `deriveEncryptionKey`; the exposure window is the generation call and the in-memory decrypted item. *(Inferred.)*
- A discriminated union (`kind`) in the decrypted JSON lets old clients keep working: existing items have no `kind`. An old client that meets a passkey item must treat it as unknown and not corrupt it on update. *(Inferred; needs a test.)*
- The existing `encrypt()` accepts a string, so no change to `packages/crypto` is required for storage. New helpers would be needed for ES256 key generation, DER signature conversion, CBOR/COSE encoding and authenticator-data assembly (section 6.3).

### 5.3 What the server would and would not see

| Server sees | Server does not see |
|---|---|
| Encrypted blob, IV, item id, owner, created/updated timestamps, blob length | RP identifier, credential ID, user handle, private or public key, that the item is a passkey rather than a login |
| Request timing and volume (e.g. a burst of reads at login) | Which RP a given signature was produced for |

The RP, not ZeroVault, receives the public key and signatures. ZeroVault's server is not a party to any WebAuthn ceremony, which is consistent with the zero-knowledge claim. Item length can leak coarse information (a passkey item is larger than a typical login); padding is a possible mitigation and is outside the scope of the first phases.

### 5.4 Sync and counters

- Items are independent encrypted rows, so creating a passkey on one device and reading it on another reuses the existing `GET /vault` path with no new mechanism.
- Authenticators that sync should not rely on a monotonically increasing signature counter, because replicas would diverge. Setting `signCount` to 0 on every assertion is the standard approach for multi-device credentials *(general WebAuthn knowledge; the specification section on `signCount` was in the part of the specification not read in this study)*.
- Flags: a ZeroVault credential is multi-device, so `BE=1`, and `BS=1` once it is synced [S2]. User presence is set on explicit consent; user verification should be set only if ZeroVault actually performs a verification step (section 5.5).
- Conflict model: last-write-wins per item, as for logins today. Because `signCount` stays 0, a pure "use" of a passkey writes nothing, so use cannot conflict. An optional `lastUsedAt` update would reintroduce writes and should be skipped or batched.
- Deletion: deleting an item in ZeroVault does not delete the credential at the RP [S9 reports the same for 1Password]. The UI must say so.

### 5.5 New threat surface relative to today

| Threat | Today (passwords/TOTP) | With software passkeys | Mitigation |
|---|---|---|---|
| Vault breach (server DB leak) | Ciphertext only; strength depends on the master password and 600k PBKDF2 | Same: private keys are inside the ciphertext | Unchanged; master-password quality now protects keys that were designed to be unclonable |
| Offline brute force of the master password | Yields passwords | Yields passkey private keys too | Higher KDF cost, or an additional secret (future work) |
| Malicious or compromised extension update | Reads passwords | Can sign for any RP, silently if consent is skipped | Per-use consent UI, supply-chain hygiene |
| Origin confusion in the interception layer | Autofill already checks origin (`shouldFill`) | A wrong origin or rpId check produces a signature valid for the wrong site, defeating phishing resistance | Derive origin from `sender`, validate rpId as a registrable suffix of the origin; unit-test with lookalike hosts as the existing suffix tests do |
| Page JavaScript tampers with the shim | Not applicable | The page can forge shim messages or block the shim | Shim carries no secret, background re-derives everything; treat shim failure as "fall back to native" |
| Loss of hardware-bound property | n/a | A device compromise or XSS in the extension context exposes keys; hardware-bound authenticators resist this [S2][S14] | Keep keys decrypted only during signing; clear on lock |
| Weaker user verification | n/a | No biometric; at best master-password re-entry or an idle window [S3] | Explicit consent prompt; require unlocked session |
| Account lockout | Recoverable via RP reset flows | Same, plus: deleting or losing the vault loses every passkey with no RP-side revocation [S9] | Export (future CXP [S11]), clear UX warnings |
| RP rejects unknown authenticators | n/a | AAGUID is visible to RPs and may be used to identify providers [S6] | Use the all-zero AAGUID with "none" attestation; document that some RPs may refuse *(inferred; not source-confirmed)* |

---

## 6. Proposed architecture

### 6.1 Components

```
 Web page (any RP)
   |  navigator.credentials.create/get
   v
 [MAIN-world shim]  (document_start, no secrets)
   |  postMessage / CustomEvent
   v
 [Isolated content script]  (relay only; adds nothing the page could not)
   |  chrome.runtime.sendMessage
   v
 [Background service worker]  <-- holds Session { key, items } (existing)
   |  - derives origin from `sender`
   |  - validates rpId against origin
   |  - asks the user (consent UI)
   |  - decrypts passkey item, imports key non-extractable, signs
   |  - returns PublicKeyCredential JSON to the shim
   v
 ZeroVault API  (unchanged: stores/returns { ciphertext, iv } only)
```

The extension already has the pieces this needs: a background session with the in-memory key, a sender-id gate on messages, origin matching (`siteHostname`, `shouldFill`), a content script and a popup. *(Verified by reading `session.ts` and `odd/tasks/zerovault-extension.md`.)*

### 6.2 Registration flow (create)

1. Shim intercepts `create()`; if `publicKey` is absent or the request cannot be served (for example `authenticatorAttachment: "cross-platform"` only), call the saved native `create()`.
2. Content script forwards `{ publicKey options as JSON }` to the background.
3. Background computes the origin from `sender`, validates `rp.id` (defaults to the origin's effective domain; must be a suffix of it), and refuses if the vault is locked (opens the popup/unlock prompt; the exact MV3 mechanism is an open item, section 9).
4. Consent: show the RP, the user name and an Allow or Deny choice.
5. Generate an ECDSA P-256 key pair, a random credential ID, build `clientDataJSON` (`type: "webauthn.create"`, challenge, origin), the COSE public key and the attested credential data; attestation format `none`.
6. Encrypt a `PasskeyEntry` with the vault key and `POST /vault` through the existing API client.
7. Return the `PublicKeyCredential` (JSON-serialised, rebuilt as a real object by the shim).

### 6.3 Authentication flow (get)

1. Shim intercepts `get()`; if the vault holds no matching passkey, call the native `get()` (so Google Password Manager, platform or hardware keys keep working).
2. Background filters passkeys by `rpId`, and by `allowCredentials` when provided; discoverable credentials are listed when `allowCredentials` is empty [S2].
3. Consent plus passkey choice; user presence is established by this explicit action.
4. Build `authenticatorData` (rpIdHash, flags, counter 0), compute `clientDataJSON` for `webauthn.get`, sign `authenticatorData || SHA-256(clientDataJSON)` with ES256.
5. Convert the signature to ASN.1 DER. Web Crypto's ECDSA output is the raw `r||s` form; WebAuthn requires DER *(general knowledge; not source-checked in this study, to be verified in the first unit test against a known-good vector)*.
6. Return the assertion with `userHandle` where available [S3].

### 6.4 Needed primitives (new code in `packages/crypto` or a sibling package)

- `generatePasskeyKeyPair()`, `exportPkcs8()`, `importSigningKey()`.
- A minimal CBOR encoder for the COSE key and the attestation object, or a small vetted dependency (a supply-chain decision for the thesis).
- `buildAuthenticatorData()`, `derToEs256()` and `es256ToDer()`, `buildClientDataJson()`.
- All of them are pure functions and fit the project's strict TDD mode (RED/GREEN with `vitest`), including test vectors generated by an independent library.

### 6.5 Alternative: `chrome.webAuthenticationProxy`

The structured request and completion path in [S1] would replace the shim and content-script relay with `onCreateRequest` and `onGetRequest` handlers in the service worker. It was not chosen as the primary path because:

- it is exclusive and global, and suspends native processing [S1];
- it is designed for remote desktop, not password managers [S1];
- Web Store acceptability for this use is unverified;
- the shim path lets ZeroVault fall back to native providers [S3].

It is worth a small, time-boxed spike (phase 4) because it could remove the main-world shim, which is the most fragile component. The spike should measure whether non-ZeroVault credentials can be proxied back to the native stack at all; the documentation does not describe such a path.

---

## 7. Phased implementation plan

All phases assume Chrome desktop, MV3, load-unpacked. Estimates are for a single developer and should be treated as rough.

| Phase | Content | Exit criterion | Est. effort | Fits before 2026-10-26? |
|---|---|---|---|---|
| 0 | This study; threat model; decision on scope | Document reviewed | done | Yes |
| 1 | Crypto and data model: ES256 keygen, PKCS#8 wrap in the existing AES-GCM blob, COSE/CBOR, authenticatorData, DER conversion; `PasskeyEntry` type; tests with independent vectors; no UI | All unit tests green; round trip create then sign then verify with an independent verifier | 3 to 4 days | Yes |
| 2 | Extension: MAIN-world shim, relay, background handlers, minimal consent UI, native fallback; demo against a test RP (for example a public WebAuthn demo site) | Register and sign in on a test RP in Chrome with a ZeroVault passkey, vault synced between two profiles | 4 to 5 days | Tight but plausible |
| 3 | Hardening: origin and rpId tests with lookalike hosts, cross-origin iframe policy, lock-state handling, abort/timeouts, excluded domains, UI to list and delete passkey items, web-app viewing | Security test list passes; manual test matrix on 5 to 10 real RPs recorded | 5+ days | No, future work |
| 4 | Spike: `chrome.webAuthenticationProxy` as transport; evaluation report | Written comparison with measurements | 2 to 3 days | Optional |
| 5 | Interoperability: PRF-based unlock, CXP/CXF export, user verification improvements | n/a | weeks | No, future work |
| 6 | Native providers: Android Credential Manager, iOS Credential Provider Extension, Windows plugin | n/a | months | No, out of scope |

### Hard dependencies

1. A working, unlocked extension session (already implemented; the session drops on worker restart, which makes "locked while a WebAuthn call is pending" a design case, not an edge case).
2. A correct, independent test oracle for authenticator data, COSE and DER encodings (phase 1).
3. A stable test RP and a Chrome version supporting the chosen injection mechanism (Chrome 102 or later for registered main-world scripts [S12]).
4. For phase 4 only: Chrome 115 or later and acceptance of the exclusivity constraint [S1].

### Minimal credible first step

Phase 1 alone is the minimal credible unit: a tested library that can create a passkey, wrap it in the existing zero-knowledge storage model, and produce a signature that an independent WebAuthn verifier accepts. It demonstrates the central research claim (passkeys fit the zero-knowledge model) without relying on any unstable browser behaviour.

---

## 8. Alternative scope: ZeroVault as a relying party

A much smaller feature is available to a web app and an extension without any provider role: let users **sign in to ZeroVault** (or unlock the vault) with a passkey held by another authenticator. This is ordinary WebAuthn registration and authentication on the API side.

- Using the WebAuthn **PRF** extension, the authenticator can derive a deterministic 32-byte secret per credential, which can feed a key-derivation step instead of, or in addition to, the master password [S13]. Caveats reported in a secondary source [S13]: support differs per platform and per credential manager, a capability flag does not guarantee a PRF output, and a lost passkey means lost data unless a recovery path exists.
- This would change the zero-knowledge key hierarchy (a wrapped copy of the vault key, or a second derivation path) and is a cryptographic design task of its own. It is a candidate for future work, not a quick win.

---

## 9. Risks and open questions

### 9.1 Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Page-world interception is unsupported and can break on browser updates, strict CSP, iframes or timing [S3] | Medium | High | Keep the shim minimal; native fallback; document support matrix |
| R2 | Origin or rpId validation bug yields phishable signatures | Low to medium | Critical | Pure, heavily tested validator; derive origin from `sender` only |
| R3 | Schedule: two weeks to deadline, phases 1 and 2 total 7 to 9 days of focused work | High | Medium | Commit to phase 1 as the minimum; phase 2 as stretch |
| R4 | Some RPs reject or degrade non-hardware authenticators or block unknown AAGUIDs | Medium | Medium | Report observed RP behaviour as a result |
| R5 | Key export in the extension context weakens the "non-extractable" posture | Certain (by design) | Medium | Narrow window, clear on lock, document explicitly |
| R6 | User verification weaker than platform authenticators | Certain | Medium | Explicit consent and an unlocked session; state the limitation |
| R7 | `chrome.webAuthenticationProxy` restrictions (global, exclusive, native companion semantics, Web Store policy) | High if chosen | Medium | Treat as spike only [S1] |
| R8 | MV3 worker restarts drop the session mid-ceremony | Medium | Medium | Fail the request cleanly and fall back to native |
| R9 | Passkey records increase the blast radius of a master-password compromise | Certain | High | Say so in the thesis; link to future work on a second secret |

### 9.2 Open questions

1. Can `attach()` be used without the native companion application, and are non-ZeroVault requests returnable to the native stack? (Not stated in [S1].)
2. Which request fields does the proxy API provide for cross-origin iframes (`topOrigin`, `crossOrigin`)?
3. Can the extension open its UI to ask for unlock or consent at the moment a page calls `get()`? Chrome's rules on user-gesture requirements for opening the popup were not checked in this study.
4. What is the exact manifest syntax and timing guarantee for a `"world": "MAIN"` content script at `document_start` in the targeted Chrome version?
5. Should the vault item discriminator and the `VaultItem` response types in `packages/shared-types` evolve, given that the server treats the blob as opaque?
6. How should an old client behave when it meets a `kind: "passkey"` item?
7. Current status (as of October 2026) of the FIDO CXP/CXF specifications beyond the 2024 working draft [S11].

---

## 10. Recommendation and limits of this study

### 10.1 What is realistic to claim and demonstrate in the thesis

- **Claim**: passkeys are a different class of credential from passwords and TOTP seeds, and supporting them requires acting as a WebAuthn authenticator (sections 2 and 3).
- **Claim**: the existing zero-knowledge storage model accommodates software passkey private keys with no server change, and the server learns nothing beyond what it learns about logins today (section 5).
- **Demonstrate (phase 1)**: a tested library and data model producing assertions that an independent verifier accepts.
- **Demonstrate if time allows (phase 2)**: registration and sign-in against a test RP in desktop Chrome, with native fallback.
- **Document as future work**: native mobile and Windows providers, user verification, PRF unlock, CXP/CXF export, `webAuthenticationProxy` evaluation, hardening and RP compatibility testing.

### 10.2 What should not be claimed

- Not that ZeroVault is a drop-in replacement for platform passkey managers.
- Not that the approach is endorsed or supported by Chrome: the supported route for extensions does not exist; the technique mirrors what Bitwarden documents as its own workaround [S3].
- Not that software-held passkeys retain the hardware-bound security properties described in [S2][S14].

### 10.3 Claims that could not be verified

1. Apple Credential Provider details beyond search-result summaries; Apple's own reference pages could not be fetched (HTTP 404 and an empty page).
2. Whether `chrome.webAuthenticationProxy.attach()` works without the native companion app, and whether non-remote-desktop use is accepted by the Chrome Web Store.
3. The exact fields in `webAuthenticationProxy` requests (iframe/top origin).
4. Whether Bitwarden's shim runs as a main-world script or via another injection route (the cited page says only "injecting a script").
5. Windows 11 third-party plugin general-availability date, and MSIX packaging requirements (secondary sources only; the official sample [S8] was read through a search summary, not in full).
6. The current (late 2026) status of FIDO CXP/CXF; only a 2024 working draft was retrieved.
7. The WebAuthn Level 3 specification was retrieved as a page stating it is a W3C Recommendation dated 25 August 2026; only the first part (about 100,000 of about 500,000 characters) was read, so `signCount` rules and extension semantics were not confirmed from the specification text.
8. ES256 DER versus raw signature conversion, and Web Crypto's support of ECDSA P-256 key generation and export, are stated from general knowledge and were not source-checked.
9. 1Password's sync architecture for passkeys; the cited page does not describe it.
10. Whether some RPs refuse unknown authenticators or AAGUIDs in practice.
11. A Corbado article and Windows news items [S13][S16] are secondary sources; PRF support figures should be re-measured before being cited as fact.

---

## Sources

- [S1] Chrome for Developers, `chrome.webAuthenticationProxy` API reference: https://developer.chrome.com/docs/extensions/reference/api/webAuthenticationProxy
- [S2] W3C, Web Authentication: An API for accessing Public Key Credentials, Level 3: https://www.w3.org/TR/webauthn-3/
- [S3] Bitwarden Contributing Docs, Passkeys, provider implementation, browser extension: https://contributing.bitwarden.com/architecture/deep-dives/passkeys/implementations/provider/browser-extension
- [S4] Bitwarden Help Center, Storing passkeys: https://bitwarden.com/help/storing-passkeys/
- [S5] Android Developers, Building a credential provider: https://developer.android.com/identity/sign-in/credential-provider
- [S6] Chrome for Developers blog, Passkeys UX updates on Chrome on Android (Credential Manager), 2024-08-05: https://developer.chrome.com/blog/passkeys-on-credential-manager
- [S7] Microsoft Learn, Support for passkeys in Windows: https://learn.microsoft.com/en-us/windows/security/identity-protection/passkeys/
- [S8] Microsoft Learn, Passkey Manager sample (WebAuthn plugin APIs): https://learn.microsoft.com/es-es/samples/microsoft/windows-classic-samples/passkeymanager
- [S9] 1Password Support, Save and use passkeys: https://support.1password.com/save-use-passkeys/
- [S10] Apple credential provider material, via search summaries: Apple tutorial https://developer.apple.com/tutorials/data/documentation/authenticationservices/ascredentialproviderviewcontroller.md ; Apple Developer Forums thread on passkey capability key https://origin-devforums.apple.com/forums/thread/745587 ; explainer https://www.panicvault.org/apple/credential-provider-extensions/
- [S11] FIDO Alliance, Credential Exchange Protocol, Working Draft 2024-10-03: https://fidoalliance.org/specs/cx/cxp-v1.0-wd-20241003.html
- [S12] Chrome for Developers, `chrome.scripting` API reference (ExecutionWorld MAIN/ISOLATED): https://developer.chrome.com/docs/extensions/reference/api/scripting
- [S13] Corbado, Passkeys and WebAuthn PRF for end-to-end encryption (secondary source, 2026): https://www.corbado.com/blog/passkeys-prf-webauthn
- [S14] passkeys.dev, Terms: https://passkeys.dev/docs/reference/terms/
- [S15] Chrome for Developers, Signal API for passkeys on Chrome desktop (appeared in search results; not otherwise used): https://developer.chrome.com/blog/passkeys-signal-api
- [S16] Windows 11 third-party passkey plugin news (secondary sources): https://cyberinsider.com/windows-11-integrates-native-support-for-bitwarden-and-1password/ ; https://itdaily.com/news/security/windows-11-1password-bitwarden
- [S17] 1Password blog on FIDO import/export draft specs (search result; the page itself was not read because of a redirect): https://1password.com/blog/fido-alliance-import-export-passkeys-draft-specs

Local ZeroVault sources read: `packages/crypto/src/index.ts`, `apps/web/src/vault/vault-entry.ts`, `apps/web/src/vault/vault-service.ts`, `apps/extension/src/background/session.ts`, `odd/tasks/zerovault-extension.md`.
