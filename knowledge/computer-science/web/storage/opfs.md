# Origin Private File System (OPFS)

## What is

It is a browser-provided private storage area for a specific web origin. In simple terms, it is like a private local file system that belongs only to your web application.
For example, a web app from:

[https://example.com](https://example.com)

can store files in its own OPFS space, and another site such as:

[https://another-site.com](https://another-site.com)

cannot directly access that data.
OPFS is useful for storing large client-side data, especially binary files, such as:

- 3D tiles
- point cloud chunks
- cached property data
- metadata files
- decoded or partially decoded data
It is more suitable for large structured data than `localStorage`, and often more natural than `IndexedDB` when the data is file-like.

## Memory Limitation

Use below code to check the quota and usage of OPFS:  
The `unit` of the `usage` and `quota` is `byte`.

```
async function logStorageEstimate() {
  const estimate = await navigator.storage.estimate(); 
  console.log({
    usage: estimate.usage,
    quota: estimate.quota,
    usageMB: Math.round((estimate.usage ?? 0) / 1024 / 1024), //unit is byte
    quotaMB: Math.round((estimate.quota ?? 0) / 1024 / 1024)
  });
}
```

My current workstation has `10GB` of quota.
When writing, we may encounter `QuotaExceededError` when exceeds limitation.
We should set a budeget of the quota usage to avoid the full usage of quota. For example, 50%.

## Clear OPFS
1. User clean the site data in the browser setting
2. App clean the OPFS by code

We can clear the OPFS by below code:

```
async function clearOpfsOnLogout() {
  const root = await navigator.storage.getDirectory();

  for await (const [name] of root.entries()) {
    await root.removeEntry(name, { recursive: true });
  }
}
```
3. browser auto-clean
Sudo code for browser clean:

```
function browserStoragePressureHandler() {
  if (!deviceStorageIsLow()) {
    return;
  }
  const candidates = getOriginsUsingStorage()
    .filter(origin => !origin.hasPersistentStorage)
    .sort(byLeastRecentlyUsedOrLargestUsage);
  for (const origin of candidates) {
    evictOriginStorage(origin);
    if (deviceStorageIsHealthyAgain()) {
      break;
    }
  }
}
```
Possible trigger of auto clean by browser:
- The device is running low on storage space.
- The browser profile is running low on available storage.
- The origin is using too much storage.
- The site has not been visited for a long time.
- The site has not been granted persistent storage.
- Browser privacy policies require the site data to be cleared.

If we want to avoid the browser to clean the data automatically, we need to persist the storage.
For example:
```
await navigator.storage.persist();
```
But user manual clean up, application manual clean up, uninstall of the browser, damage of the profile will still lose the data even if it is persistent.

## Security

## Debugging Tool

Chrome extension for OPFS:

1. [https://chromewebstore.google.com/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd](https://chromewebstore.google.com/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd)
2. [https://chromewebstore.google.com/detail/opfs-explorer/hhegfidnlemidclkkldeekjamkfcamic](https://chromewebstore.google.com/detail/opfs-explorer/hhegfidnlemidclkkldeekjamkfcamic)

---

Reference:

1. [https://web.dev/articles/origin-private-file-system](https://web.dev/articles/origin-private-file-system)
2. [https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
3. [https://rxdb.info/rx-storage-opfs.html](https://rxdb.info/rx-storage-opfs.html)

