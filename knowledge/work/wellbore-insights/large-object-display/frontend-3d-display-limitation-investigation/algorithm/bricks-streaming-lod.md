# Bricks+streaming+LOD

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FFrontend%203D%20Display%20Limitation%20Investigation%2FAlgorithm%2FBricks%2Bstreaming%2BLOD) on 2026-06-26.

## Brick + LOD Capacity Analysis

  

Brick and LOD solve different problems.

  

```text

Brick:

á Loads only the required spatial subset.

  

LOD:

á Reduces the resolution required to represent a larger region.

```

  

Together, they provide the practical architecture for large data display.

  

### Brick + LOD Formula

  

```text

brickSamples = brickX * brickY * brickZ

brickBytes = brickSamples * bytesPerSample * overheadFactor

activeBrickCount = GPUCache / brickBytes

sourceSamplesRepresented = activeBrickCount * brickSamples * 8^lodLevel

```

  

This is equivalent to:

  

```text

sourceSamplesRepresented = activeSampleCount * 8^lodLevel

```

  

The difference is that brick controls which spatial regions are active, while LOD controls how much source area each active sample represents.

  

### Brick + LOD Example With 128│ Bricks, R16, 2GB GPU Cache

  

Raw 128│ R16 brick:

  

```text

128 * 128 * 128 * 2 bytes = 4MB

```

  

Active bricks:

  

```text

2GB / 4MB = ~512 bricks

```
  

# Source Coverage (2GB GPU Cache, R16 / Uint16)

## Raw Capacity
| LOD Level | Active Bricks | Active GPU Samples | Source Samples Represented | Equivalent Source Cube |
|-----------|---------------|--------------------|----------------------------|------------------------|
| **LOD 0** | ~512          | ~1.07B             | ~1.07B                     | ~1024│                 |
| **LOD 1** | ~512          | ~1.07B             | ~8.59B                     | ~2048│                 |
| **LOD 2** | ~512          | ~1.07B             | ~68.7B                     | ~4096│                 |
| **LOD 3** | ~512          | ~1.07B             | ~550B                      | ~8192│                 |

## With Overhead Factor = 1.2
- Active bricks drop to about **426**.  
- Active GPU samples drop to about **893M**.  
- The same LOD multipliers still apply.

| LOD Level | Active Bricks | Active GPU Samples | Source Samples Represented | Equivalent Source Cube |
|-----------|---------------|--------------------|----------------------------|------------------------|
| **LOD 0** | ~426          | ~893M              | ~893M                      | ~960│                  |
| **LOD 1** | ~426          | ~893M              | ~7.15B                     | ~1920│                 |
| **LOD 2** | ~426          | ~893M              | ~57.2B                     | ~3840│                 |
| **LOD 3** | ~426          | ~893M              | ~458B                      | ~7680│                 |


  

With `1.2` overhead, active bricks drop to about `426`, and active samples drop to about `893M`. The same LOD multipliers still apply.
