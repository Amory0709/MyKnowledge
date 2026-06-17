# Understanding Digital Storage Units

## 1. Bit

`bit` is the smallest unit of digital data.

A bit can only represent one of two values:

```text
0 or 1
```

## 2. Byte

A `byte` is made of 8 bits.

```text
1 byte = 8 bits
```

Examples:

```text
8 bits  = 1 byte
16 bits = 2 bytes
32 bits = 4 bytes
64 bits = 8 bytes
```

In most programming and storage APIs, file sizes, memory sizes, and browser storage quota are measured in bytes.

## 3. KB, MB, and GB

`KB`, `MB`, and `GB` are larger units based on `byte`.

There are two common calculation systems:

- Decimal system
- Binary system

## 4. Decimal System

The decimal system uses powers of 1000.

It is commonly used by disk manufacturers, network bandwidth descriptions, and product-facing storage labels.

```text
1 KB = 1,000 bytes
1 MB = 1,000 KB = 1,000,000 bytes
1 GB = 1,000 MB = 1,000,000,000 bytes
```

## 5. Binary System

The binary system uses powers of 1024.

It is commonly used in memory calculations, programming, and many browser storage calculations.

```text
1 KiB = 1,024 bytes
1 MiB = 1,024 KiB = 1,048,576 bytes
1 GiB = 1,024 MiB = 1,073,741,824 bytes
```

Strictly speaking:

```text
KiB = kibibyte
MiB = mebibyte
GiB = gibibyte
```

However, many systems still display these values as `KB`, `MB`, and `GB`, even when they are calculated using 1024.

## 6. Common Code Conversion

In code, byte conversion is usually written with `1024`:

```ts
const kb = bytes / 1024;
const mb = bytes / 1024 / 1024;
const gb = bytes / 1024 / 1024 / 1024;
```

Example:

```ts
const bytes = 1_073_741_824;

console.log(bytes / 1024 / 1024 / 1024); // 1
```

This value is exactly `1 GiB`, although many applications may display it as `1 GB`.

## 7. Browser Storage Quota

Browser storage APIs, such as `navigator.storage.estimate()`, report storage usage and quota in bytes.

Example:

```ts
const { usage = 0, quota = 0 } = await navigator.storage.estimate();

console.log('usage bytes:', usage);
console.log('quota bytes:', quota);
```

To display these values in a more readable format:

```ts
function formatBytes(bytes = 0): string {
  const mb = bytes / 1024 / 1024;
  const gb = mb / 1024;

  return gb >= 1
    ? `${gb.toFixed(2)} GB`
    : `${mb.toFixed(2)} MB`;
}
```

## 8. Summary

```text
1 byte = 8 bits

1 KB ≈ 1,000 bytes
1 MB ≈ 1,000,000 bytes
1 GB ≈ 1,000,000,000 bytes

1 KiB = 1,024 bytes
1 MiB = 1,048,576 bytes
1 GiB = 1,073,741,824 bytes
```

## 9. Key Takeaway

`bit` is the smallest unit. `byte` is 8 bits. `KB`, `MB`, and `GB` are larger byte-based units.

For engineering calculations, especially memory and browser storage quota, use bytes as the base unit and usually convert with `1024`.
