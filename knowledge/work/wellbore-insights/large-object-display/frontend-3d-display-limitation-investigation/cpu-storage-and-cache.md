# CPU Storage and Cache

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FFrontend%203D%20Display%20Limitation%20Investigation%2FCPU%20Storage%20and%20Cache) on 2026-06-26.

# Solution Proposal: Origin Private File System (OPFS)

## What is

It is a browser-provided private storage area for a specific web origin. In simple terms, it is like a private local file system that belongs only to your web application.
For example, a web app from:

https://example.com

can store files in its own OPFS space, and another site such as:

https://another-site.com

cannot directly access that data.
OPFS is useful for storing large client-side data, especially binary files, such as:
*   3D tiles
*   point cloud chunks
*   cached property data
*   metadata files
*   decoded or partially decoded data
It is more suitable for large structured data than`localStorage`, and often more natural than`IndexedDB`when the data is file-like.

## Limitation

OPFS is not a general-purpose replacement for a backend storage system.
Key limitations include:
*   Origin-bound storage: data is only available to the same browser origin.
*   Browser-managed quota: storage size is controlled by the browser and device conditions.
*   Data may be evicted: under storage pressure, the browser may clear site data.
*   Not easily user-visible: users do not normally access OPFS files directly like normal downloads.
*   Browser support differences: behavior and quota may vary between browsers.
*   No built-in business-level cache invalidation: the application must manage versions, expiration, and cleanup.
*   Not a database: OPFS stores files; indexing, metadata lookup, and consistency rules must be designed by the application.
For large 3D systems, OPFS should be treated as apersistent local cache, not as the source of truth.


My current workstation has `10GB` of quota.

When writing, we may encounter `QuotaExceededError` when exceeds limitation.

We should set a budget of the quota usage to avoid the full usage of quota. For example, 50%


## Clear OPFS
1. User clean the site data in the browser setting
2. App clean the OPFS by code
3. browser auto-clean

## Security

Protections OPFS Provides
-------------------------

*   Origin isolation: Data under`https://your-domain`cannot be read directly by other origins.
*   Browser sandbox: Ordinary web pages cannot arbitrarily read system files.
*   No direct user-facing paths: Unlike typical downloaded files, OPFS data is not exposed via obvious filesystem paths to the user.

Limitations
-----------

*   Same-origin script access: Any compromised script within the same origin can read OPFS data.
*   XSS risk: If XSS occurs, an attacker can read cached data via JavaScript and exfiltrate it.
*   Local access: Users with machine access, malware, or debugging tools may still reach browser profile data.
*   No application-layer encryption by default: OPFS data is typically not encrypted at the application layer.
*   Data loss scenarios: Clearing cache, browser policies, private/incognito mode, and storage pressure can all cause data loss.
*   Not suitable for long-lived sensitive data: Also unsuitable for data that should become inaccessible after permission changes.

Security Model
--------------

OPFS security is closer to:
*   Browser local cache
It isnotequivalent to:
*   Encrypted database / key vault

* * *

How to Encrypt
--------------

Use the[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)for application-layer encryption:

Server data / binary chunk



Decrypt + verify permissions



Encrypt before writing to OPFS



Decrypt after reading from OPFS



Worker decode  Plot3D usage

### Better practice

1.  Storeencrypted tile/property chunksin OPFS
2.  Keepdecrypted`Float32Array`in memory only briefly
3.  After GPU upload,release CPU decrypted buffers as soon as possible

* * *

Key Management
--------------

The critical issue is not whether to use AES, but ensuringkeys are not stored in plaintext alongside ciphertext long-term on the client.

### Recommendations

*   Issue ashort-lived data encryption key (DEK)per session from the server, or issue a token that can unwrap the data key
*   Clear in-memory keys on logout
*   Storeonly ciphertext and metadatain OPFS  never plaintext keys
*   On permission change or token expiry, old cache becomesundecryptable, or invalidate viaversion/epoch
*   Usedifferent keys or key IDsper dataset / version / property
*   UseAES-GCMwith authentication to prevent tampering
*   Use aunique nonce/IV per chunk
*   Store in metadata:`keyId`,`iv`,`algorithm`,`datasetVersion`,`expiresAt`

* * *

XSS Still Matters
-----------------

Encrypting OPFSdoes not fully protect against XSSfor data the current user is authorized to access.
While the user is actively using the app,decryption keys exist in page memory. A malicious same-origin script can invoke the same decryption path and read the data.

### Additional controls

*   StrictContent Security Policy (CSP)
*   Avoid`unsafe-inline`
*   Supply chain auditingfor dependencies
*   Donotexpose tokens/keys in`localStorage`
*   UseHttpOnly cookiesfor auth tokens
*   Applypermission and lifecycle controlsto OPFS read APIs
*   Clear cache and in-memory keys onlogout, tenant switch, or project switch

* * *

Recommended Tiered Strategy
---------------------------

| Tier | Data type | Policy |
| --- | --- | --- |
| <br><br>L0<br><br> | <br><br>Temporary, non-sensitive cache<br><br> | <br><br>No encryption; short TTL; clear on browser close / logout<br><br> |
| <br><br>L1<br><br> | <br><br>Normal business cache<br><br> | <br><br>OPFS encrypted; session key; TTL; version invalidation<br><br> |
| <br><br>L2<br><br> | <br><br>High-value customer data<br><br> | <br><br>OPFS encrypted; short-lived key; clear on logout; clear on permission change; disable long-term offline cache<br><br> |
| <br><br>L3<br><br> | <br><br>Strict compliance data<br><br> | <br><br>Donotpersist to OPFS; memory cache only; disable local persistence if required<br><br> |

* * *

Summary
-------

OPFS is a useful performance layer for large visualization payloads, but its trust model matchesorigin-scoped browser storage, not a secure vault. For reservoir, well, and production-related datasets, treat encrypted OPFS with session-bound keys, explicit TTL/version invalidation, and logout cleanup as the default  unless the product explicitly classifies the data as disposable, re-fetchable cache.


Reference:
1. https://web.dev/articles/origin-private-file-system
2. https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
3. https://rxdb.info/rx-storage-opfs.html
4. https://chromewebstore.google.com/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd
5. https://chromewebstore.google.com/detail/opfs-explorer/hhegfidnlemidclkkldeekjamkfcamic
