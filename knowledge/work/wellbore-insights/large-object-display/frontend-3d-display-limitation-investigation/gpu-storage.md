# GPU Storage

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FFrontend%203D%20Display%20Limitation%20Investigation%2FGPU%20Storage) on 2026-06-26.

## Purpose

  

This document summarizes the frontend architecture analysis for rendering very large subsurface 3D datasets in a browser, including seismic volume data, drilling trajectories, well data, reservoir grid / pillar grid data, time-series properties, surfaces, and custom shaders.

  

The focus is not the total raw data size stored in the backend. The focus is the maximum active data that can be kept in browser memory and GPU memory and rendered at an acceptable frame rate.

  

The main conclusion is:

  

> Browser 3D rendering capacity is determined by **active visible data**, not by total source data size.

  

Therefore, a large 10GB+ seismic volume can be part of the same scene, but the frontend must not load or upload the full dataset at full resolution. The system must use chunking, LOD, streaming, local cache, worker processing, and GPU resource eviction.

  

## Local Hardware Baseline

  

The current machine was inspected through Chrome WebGL2 capability detection.

  

Detected GPU and WebGL limits:

  ![image.png](/.attachments/image-c79634eb-5a8e-44a2-b3a9-17bd3363ff5d.png)

- **GPU renderer**: NVIDIA Quadro T2000 with Max-Q Design
- **VRAM**: 4GB

- **WebGL version**: WebGL 2.0


- `MAX_TEXTURE_SIZE`: 16384 

- `MAX_3D_TEXTURE_SIZE`: 2048

- `MAX_TEXTURE_IMAGE_UNITS`: 16

- `MAX_COMBINED_TEXTURE_IMAGE_UNITS`: 32


Important note:

`MAX_3D_TEXTURE_SIZE = 2048` is a dimension limit, not a memory guarantee. A `2048^3` 3D texture is not realistic on a 4GB GPU.


## GPU Cache Definition
In this document, GPU cache means the active renderable resource set already uploaded to the GPU.

  

Examples: Vertex buffers, Index buffers, Instance buffers, Data textures, 3D textures, Render targets, Shader and material resources
  

**GPU cache is not OPFS and not browser RAM.**

  

The data flow is:

  

```text

Server / OpenVDS / RESQML

 -> OPFS disk cache

 -> RAM typed arrays

 -> GPU buffers / textures

 -> Three.js / WebGL / WebGPU renderer

```

  

OPFS can store many GBs on disk, but only the active subset uploaded into GPU cache can be rendered directly.

  

## GPU Cache Budget Formula

  

Let:

  

```text

VRAM = physical GPU memory

usableRatio = percentage of VRAM safely usable by the web app

GPUCache = VRAM * usableRatio

```

  

For this machine:

- Conservative: `4 GB x 25% = 1 GB`

- **Practical: `4 GB x 50% = 2 GB`**

- Aggressive: `4 GB x 65% = 2.6 GB`

- Theoretical: `4 GB x 100% = 4 GB`

  
The practical design target should be `1GB - 2GB` active GPU data. The aggressive budget can be used for experiments, but it should not be the default stable target.

  

## Meshless Data Capacity

Meshless data display means the data is represented as samples in textures or 3D bricks rather than converted into triangle meshes.

  

Typical examples: 2D seismic slice, 3D volume bricks, Volume rendering, Shader-based sampling, GPU texture lookup
  
The capacity formula is:

```text

activeSampleCount = GPUCache / bytesPerSample

equivalentCubeSize = cubicRoot(activeSampleCount)

```

Common sample formats:

- `R8 / Uint8`: 1 byte per sample

- `R16 / Uint16`: 2 bytes per sample

- `R32F / Float32`: 4 bytes per sample

  

### Meshless Capacity By GPU Cache

**B stands for Billion**
  
| GPU Cache | Format|  Samples | similar cube size |
|-----------|------|------------------|----------------|
| **1 GB**  | R8   | 1.07B            |  1024        |
|           | R16  | 536M             |  812         |
|           | R32F | 268M             |  645         |
| **2 GB**  | R8   | 2.15B            |  1290        |
|           | R16  | 1.07B            |  1024        |
|           | R32F | 536M             |  812         |
| **2.6 GB**| R8   | 2.79B            |  1408        |
|           | R16  | 1.40B            |  1118        |
|           | R32F | 698M             |  887         |
| **4 GB**  | R8   | 4.29B            |  1625        |
|           | R16  | 2.15B            |  1290        |
|           | R32F | 1.07B            |  1024        |

  

These numbers are memory-only upper bounds. Real systems need to reserve memory for: Framebuffers, Render targets, Upload buffers, Mip levels, Padding between bricks, Other scene layers, Browser and driver overhead

A safer estimate is usually **`70% - 80%**` of the memory-only value.


# GPU Cache  80%  3D Texture Limitation

| GPU Cache (80%) | Format | Samples | similar cube size |
|-----------------|--------|---------|----------------|
| **0.8 GB**      | R8     | 0.86B   |  950         |
|                 | R16    | 429M    |  757         |
|                 | R32F   | 214M    |  596         |
| **1.6 GB**      | R8     | 1.72B   |  1200        |
|                 | R16    | 0.86B   |  950         |
|                 | R32F   | 429M    |  757         |
| **2.08 GB**     | R8     | 2.23B   |  1330        |
|                 | R16    | 1.12B   |  1020        |
|                 | R32F   | 558M    |  820         |
| **3.2 GB**      | R8     | 3.43B   |  1500        |
|                 | R16    | 1.72B   |  1200        |
|                 | R32F   | 0.86B   |  950         |


## Mesh Capacity

Mesh seismic display means seismic-derived data is represented as triangles.

Typical examples: Iso-surface, Horizon surface, Fault surface, Extracted shell, Filtered seismic body boundary

  

The capacity formula is:

```text

triangleCount = GPUCache / bytesPerTriangle

```

`bytesPerTriangle` depends on vertex format, index format, attributes, and vertex sharing.

  

Typical engineering estimates:

- Optimized shared mesh: 32 bytes per triangle

- Normal production mesh: 64 bytes per triangle

- Complex attributed mesh: 128 bytes per triangle

  

### Mesh Capacity By GPU Cache

| GPU Cache | 32 B/triangle | 64 B/triangle | 128 B/triangle |
|-----------|---------------|----------------|----------------|
| **1 GB**  |  33M         |  16M          |  8M           |
| **2 GB**  |  67M         |  33M          |  16M          |
| **2.6 GB**|  87M         |  43M          |  21M          |
| **4 GB**  |  134M        |  67M          |  33M          |


These are memory-only limits. Real interactive rendering limits are lower because triangle rendering also consumes vertex shader time, rasterization, fragment shader time, overdraw, draw-call submission, and picking/filtering overhead.  

Practical target for this GPU:

- Interactive camera movement: 3M - 10M visible triangles

- Idle progressive refine: 10M - 30M visible triangles

- Memory-only experimental upper bound: 30M+ visible triangles

  

## Meshless vs Mesh Relationship

  

Meshless and mesh-based display have different capacity formulas.

  

```text

Meshless seismic:

 activeSamples = GPUCache / bytesPerSample

  

Mesh seismic:

 activeTriangles = GPUCache / bytesPerTriangle

```

  

For the same 2GB GPU cache:

  

```text

R16 meshless seismic:

 2GB / 2 bytes = ~1.07B active samples (B stands for Billion)

  

Normal production mesh:

 2GB / 64 bytes = ~33M active triangles (M stands for Million)

```
  
Meshless seismic is usually more memory-efficient for slices and volume sampling. Mesh is better for extracted shells, horizons, faults, and iso-surfaces, but the triangle count must be controlled.
