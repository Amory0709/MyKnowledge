# Algorithm

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FFrontend%203D%20Display%20Limitation%20Investigation%2FAlgorithm) on 2026-06-26.

### Practical Interpretation

  

For a 10GB R16 seismic source:

  

- Brick only:

á - Can show the whole source at once: No, not at full resolution.

á - Can show full resolution: Yes, for loaded local bricks.

á - Practical meaning: Best for local detail, slices, and focused regions.

- LOD only:

á - Can show the whole source at once: Yes, at LOD1 or lower resolution.

á - Can show full resolution: No, unless the source is small enough.

á - Practical meaning: Best for whole-volume overview.

- Brick + LOD:

á - Can show the whole source at once: Yes, with coarse overview and local detail.

á - Can show full resolution: Yes, only for selected regions.

á - Practical meaning: Best production strategy.

  

Recommended behavior:

  

```text

Camera moving:

á Load coarse LOD bricks for the whole visible area.

  

Camera idle:

á Refine important visible bricks to higher LOD.

  

User zooms or filters:

á Keep low LOD context and load full-resolution bricks only near the focus area.

```

  

## Rendering Cost Limitation

  

Memory capacity is not the only limitation. Rendering cost can become the real bottleneck.

  

For meshless volume rendering:

  

```text

frameCost ~= screenPixels * rayMarchSteps * textureFetchCost

```

  

For example, at 4K:

  

```text

3840 * 2160 = ~8.3M pixels

```

  

With 64 ray-marching steps:

  

```text

8.3M * 64 = ~531M volume samples per frame

```

  

This is very expensive even if the data fits in GPU memory.

  

Therefore:

  

- Slice rendering is much cheaper than full volume ray marching.

- Volume rendering should reduce resolution during interaction.

- Ray-marching steps should be adaptive.

- Empty-space skipping and clipping boxes are important.

- Full-quality rendering should happen after the camera becomes idle.

  

## Recommended Architecture

  

```mermaid

flowchart LR

á rawData[Raw Seismic RESQML Wells] --> preprocess[Preprocess And Conversion]

á preprocess --> openvds[OpenVDS For Seismic]

á preprocess --> gridChunks[Frontend Grid Chunks]

á openvds --> api[Visualization API]

á gridChunks --> api

á api --> opfs[OPFS Disk Cache]

á opfs --> worker[Web Worker Decode Filter Resample]

á worker --> ram[RAM TypedArray Cache]

á ram --> gpu[GPU Cache]

á gpu --> renderer[Three.js WebGL WebGPU Renderer]

á renderer --> scene[3D Subsurface Scene]

```

  

## Final Capacity Summary

For the current Quadro T2000 Max-Q class machine:

- Stable active GPU cache: 1GB - 2GB

- Aggressive active GPU cache: 2.6GB

  

The most important conclusion is:

  

> Bricks make large datasets spatially streamable. LOD makes large datasets representable at lower resolution. Brick + LOD is the only realistic way to display 10GB+ seismic data in the browser while still allowing local high-resolution inspection.# Frontend 3D Display Limitation Investigation
