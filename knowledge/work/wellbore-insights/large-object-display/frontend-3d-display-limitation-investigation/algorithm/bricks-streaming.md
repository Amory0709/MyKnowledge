# Bricks + streaming

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FFrontend%203D%20Display%20Limitation%20Investigation%2FAlgorithm%2FBricks%20%2B%20streaming) on 2026-06-26.

## Brick Capacity Analysis

A brick is a 3D chunk of a large volume dataset.

  

Example:

  

```text

Full seismic volume:

 2048 x 2048 x 1024 samples
+---------------------------------------------------+
|                                                   |
|                                                   |
|                                                   |
|                                                   |
|                                                   |
+---------------------------------------------------+

Brick:

 128 x 128 x 128 samples

+----+----+----+----+----+----+----+----+
|    |    |    |    |    |    |    |    |
+----+----+----+----+----+----+----+----+
|    |    |    |    |    |    |    |    |
+----+----+----+----+----+----+----+----+
|    |    |    |    |    |    |    |    |
+----+----+----+----+----+----+----+----+

```

The browser loads only the bricks needed for the current view, slice, filter, or volume rendering pass.

  

### Brick Formula

  

Let:

  

```text

brickSamples = brickX * brickY * brickZ

brickBytes = brickSamples * bytesPerSample * overheadFactor

activeBrickCount = GPUCache / brickBytes

activeSeismicBytes = activeBrickCount * brickBytes

activeSampleCount = activeBrickCount * brickSamples

```

  

Recommended `overheadFactor`:

  

```text

1.0 = raw ideal

1.2 = practical estimate with padding, metadata, alignment, and upload overhead

```

# Brick Capacity (2GB GPU Cache, R16 / Uint16, no LOD)

## Raw Capacity
| Brick Size | Raw Brick Size | Active Bricks | Active Samples | Equivalent Cube (Volume) | Equivalent Cube (Surface Only) |
|------------|----------------|---------------|----------------|--------------------------|--------------------------------|
| **64**    | ~0.5 MB        | ~4096         | ~1.07B         | ~1024                   | ~10240 (1000 larger)        |
| **128**   | ~4 MB          | ~512          | ~1.07B         | ~1024                   | ~10240                        |
| **256**   | ~32 MB         | ~64           | ~1.07B         | ~1024                   | ~10240                        |

## With Overhead Factor = 1.2
| Brick Size | Practical Brick Size | Active Bricks | Active Samples | Equivalent Cube (Volume) | Equivalent Cube (Surface Only) |
|------------|-----------------------|---------------|----------------|--------------------------|--------------------------------|
| **64**    | ~0.6 MB              | ~3413         | ~895M          | ~960                    | ~9600 (1000 larger)         |
| **128**   | ~4.8 MB              | ~426          | ~893M          | ~960                    | ~9600                         |
| **256**   | ~38.4 MB             | ~53           | ~889M          | ~960                    | ~9600                         |

---

# Formula Derivation: Why Surface Rendering Breaks the Limit

## Volume Rendering
- A cube requires  \( N^3 \) samples.  
- Example: \( 1024^3 \approx 1.07B \) samples.  
- With 2GB GPU memory, the maximum cube size is  **1024**.

## Surface Rendering (Only the Skin)
- A cube surface requires  \( 6 \cdot N^2 \) samples.  
- Ratio:  (6  N) / (N) = 6 / N


- For \( N = 1024 \):  6 / 1024  0.006 ( 1/170)


- This means surface samples are only ~1/170 of volume samples.  
- Therefore, the cube edge length can be scaled up by ~170.  
- Equivalent cube size:  1024  170  174,000
- Simplified: **10,000  100,000** range depending on implementation.

---

# Key Conclusion
- **Volume Rendering Limit**: ~1024 (1B samples).  
- **Surface Rendering Limit**: ~10,000  100,000 (hundreds to thousands of times larger).  
- For a **1TB reservoir model (~537B samples)**:  
  - Volume rendering  only ~1024 can fit in 2GB memory.  
  - Surface rendering  you can display the outer shell of a cube up to ~10,000 or more, giving the illusion of handling the entire massive dataset.


Conclusion:

  

> Bricks do not increase the active GPU memory capacity. They increase the total source dataset that can be explored by loading only the currently needed subset.

  

With brick-only rendering on this hardware, the active full-resolution R16 seismic data should be treated as roughly:

  

```text

Practical active R16 seismic budget:

 ~0.9B - 1.1B samples with 2GB GPU cache

 equivalent to roughly 960 - 1024 active samples

```

  

If the source seismic dataset is 10GB R16:

  

```text

10GB / 2 bytes = ~5.37B samples

```

  

With 2GB GPU cache:

  

```text

2GB / 10GB = 20%

```

  

So brick-only can keep about `20%` of a 10GB R16 dataset active on GPU at full resolution. It can display arbitrary parts of the 10GB dataset through streaming, but not all of it at full resolution at the same time.
