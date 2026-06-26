# A Good Large-Scale 3D Data System

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FA%20Good%20Large-Scale%203D%20Data%20System) on 2026-06-26.

# Large-Scale 3D Data Systems: Architecture Guide

A well-designed large-scale 3D system is **not** about "rendering one giant object." It is about **continuously scheduling the data blocks that actually need to be visible**. The core design goal is to keep **CPU, GPU, network, memory, and interaction** all under control.

This document expands on three major areas: streaming/tiling/LOD/viewport loading, paging and resource management, and progress/cancellation/budget/degradation strategies.

To satisfy below design, we did some research in https://dev.azure.com/slb1-swt/WellboreInsights/_wiki/wikis/WellboreInsights.wiki/42205/Frontend-3D-Display-Limitation-Investigation

---

## Recommended Overall Architecture

Six layers:

```

  1. Dataset Layer                     metadata, tile index, properties,
                                       statistics, bounds, LOD description

  2. Data Source Layer                 read tiles/properties from file,
                                       backend, object storage, workers

  3. Scheduler Layer                   camera, filter, LOD, budget 
                                       load / cancel / evict

  4. Processing Layer                  worker decode, transforms,
                                       reorder, compress, statistics

  5. GPU Resource Layer                buffers, textures, materials,
                                       dispose, upload queue, VRAM estimate

  6. Render Backend Layer              GeoToolkit, Three.js, WebGPU,
                                       custom backends

```

**Well3D** should be responsible for domain data source
**Plot3D** should be responsible for scheduling
**INT** should be responsible for rendering

### Core Principle

**Decouple data management from the render backend.**

Plot3D should own **tiles, LOD, cache, and budget**not hand an entire large dataset to a single `VoxelGrid` object and hope for the best.

---

## 1. Streaming / Tiling / LOD / Viewport Loading

### Streaming: Data Does Not Arrive All at Once

**Current problem:** `PointCloud` defaults to a complete `Float32Array`. Callers prepare the full dataset first, then hand it to Plot3D.

**Better design:**

- Data sources can be local files, HTTP range requests, object storage, backend services, WASM decoders, etc.
- The frontend does not require a complete array. It requests a **spatial block**, a **property**, or a **precision level**.
- Loading is **async, cancellable, retryable, and rate-limited**.
- Data formats should support **random access**: chunked binary, octree, 3D Tiles, Zarr, chunked LAS/LAZ, custom reservoir block formats, etc.

Conceptually, the API should look more like:

```typescript
interface Large3DDataSource {
  getMetadata(): Promise<DatasetMetadata>;
  loadTile(request: TileRequest, signal: AbortSignal): Promise<TilePayload>;
  loadProperty(request: PropertyRequest, signal: AbortSignal): Promise<PropertyPayload>;
}
```

Rather than:

```typescript
new PointCloudRenderable3D({
  properties: {
    x: fullArray,
    y: fullArray,
    z: fullArray,
    porosity: fullArray,
    permeability: fullArray
  }
});
```

---

### Tiling: Spatial Partitioning

Large datasets **must** be split into tiles / blocks / bricks / subgrids. For example, a reservoir grid can be cut along IJK space:

- `i: 063, j: 063, k: 031`
- `i: 64127, j: 063, k: 031`

Each block has its own:

- Bounding box
- Cell count
- Property value range
- Estimated memory size

Each block can be **loaded, released, and updated on the GPU independently**. This enables:

- Loading only data near the viewport
- Loading low-precision blocks at distance
- Releasing CPU/GPU memory for blocks that leave the view
- Isolating failures so one failed block does not break the whole scene
- Updating only affected blocks on property changes, without rebuilding the full grid

For reservoir grids, GeoToolkit's `VoxelGridGroup` / subgrid concepts are usable, but the current point-cloud reservoir path does **not** split data into subgridsit builds one monolithic grid.

---

### LOD: Different Precision at Different Distances

LOD is not just "downsampling." It is a **complete hierarchical structure**. Common patterns:

| Level | Purpose |
|-------|---------|
| **Level 0** | Coarsestdozens or hundreds of large blocks for instant first paint |
| **Level 1** | Medium precision for normal navigation |
| **Level 2+** | High precision only when close, selected, sectioned, or queried |

Each tile has an **independent payload per LOD level**. The renderer chooses which LOD to load based on camera distance, screen-space pixel error, and interaction state.

For reservoir grids, several LOD strategies apply:

- **Geometry LOD:** Merge multiple cells into one coarse cell
- **Attribute LOD:** Store min/max/avg/percentile instead of per-cell raw values
- **Surface LOD:** At distance, show only the shell or key layersnot all internal cells
- **Semantic LOD:** Prioritize faults, well trajectories, horizons, and anomaly regions; downgrade ordinary volume data

---

### Viewport Loading: Camera-Driven Scheduling

A good system has a **scheduler** that runs each frame (or after the camera stops) to decide:

1. Which tiles are needed given the camera frustum, clipping planes, section box, and current filters
2. Which LOD each tile should use based on distance and screen coverage
3. How the required set compares to currently loaded tiles
4. Which in-flight requests to **cancel**
5. Which **high-priority** requests to start
6. Which **low-priority** tiles to defer
7. Which least-important tiles to **evict** when over budget

**Critical:** While the camera moves, the system must not keep loading data for an obsolete view. Old requests must be **cancellable**, and old GPU buffers must be **releasable**.

---

## 2. Paging, LOD, GPU Buffers, Streaming Properties, Pluggable Backends

### Paging Is Spatial, Not UI Pagination

In large 3D data, the unit of paging is a **spatial block**, not "page 1, page 2."

Each tile should have a state machine:

```typescript
type TileState =
  | 'idle'
  | 'queued'
  | 'loading'
  | 'decoded'
  | 'uploading'
  | 'ready'
  | 'evicting'
  | 'failed';
```

This lets the system track:

- Which tiles are downloading
- Which tiles are in CPU memory
- Which tiles are uploaded to the GPU
- Which tiles can be released
- Which tiles failed but can be retried

---

### GPU Buffer Management Must Be First-Class

Many 3D systems only care about JS arrays and ignore GPU memory. Large-scale systems must **explicitly manage GPU resources**.

Requirements:

- **GPU buffer pool**
- **Separate** geometry buffers and attribute buffers
- **Dispose** geometry, material, texture, and buffer when a tile leaves the viewport
- **Limit uploads per frame** to avoid freezing on a single 100+ MB upload
- **Track estimated GPU buffer usage**
- **Progressive upload**e.g., only a few tiles per frame
- Support attribute textures, storage buffers, texture buffers, and other layouts suited to large attributes

A good system does not equate "load complete" with "upload everything to GPU immediately." It maintains an **upload queue**.

---

### Properties Should Stream Independently

Large volumes usually have many properties: porosity, permeability, pressure, saturation, temperature, classification, confidence, etc. Users often view only one or a few at a timethere is no need to load all properties together.

Better design:

1. Load **geometry / topology** first
2. Load the **current display property** separately
3. Load **filter properties** on demand
4. Load **high-precision local attributes** on hover / pick
5. Maintain a **separate tile cache per property**
6. On property switch, **reuse geometry** and swap only the attribute buffer
7. Preload **property range / histogram** from metadata instead of scanning full arrays

The data model should split into:

- `DatasetMetadata`
- `TileGeometry`
- `TileTopology`
- `TileProperty`
- `TileStatistics`
- `TileSelectionIndex`

not one giant `PointCloud.properties` object.

---

### Pluggable Render Backends

The current design is tightly coupled to GeoToolkit `VoxelGrid`. That is not necessarily wrong, but for very large data the **scheduling layer** and **render backend** should be separate.

Recommended layering:

| Layer | Responsibility |
|-------|----------------|
| **DataSource** | Read data |
| **TileScheduler** | Decide what to load |
| **CacheManager** | Manage CPU/GPU memory |
| **SceneAdapter** | Convert tiles into render objects |
| **RenderBackend** | Three.js, GeoToolkit, deck.gl, Potree, 3D Tiles renderer, custom WebGPU, etc. |

This allows:

- Reservoir grids  GeoToolkit
- Point clouds  Potree / octree renderer
- Volume rendering  WebGPU volume renderer
- Lightweight preview  Three.js `InstancedMesh`
- Large attribute fields  texture-based rendering

**Key principle:** Business data structures should not grow directly into a third-party renderer's parameter shape.

---

## 3. Progress, Cancellation, Resource Budget, and Degradation

### Progress: More Than `loading: true/false`

A good system tracks progress through each stage:

- Metadata loaded
- Tile queued
- Tile downloaded
- Tile decoded
- Tile transformed
- Tile uploaded to GPU
- Tile visible
- High LOD refined

What users see should not be a binary spinner, but something like:

- Currently showing a coarse version
- High precision is loading
- Loaded **128 / 512** tiles
- Memory usage **1.2 GB / 2 GB**
- Some tiles delayed due to budget limits

For large data, "never fully loaded" is normal. The system must express **progressive state**.

---

### Cancellation: Every Long Task Must Be Interruptible

Cancellable work includes:

- Network requests
- Worker decoding
- CPU reordering
- Property statistics
- GPU upload queue
- Tile loads for an old viewport
- Stale tasks after the user switches datasets

APIs should be built around **`AbortSignal`** from the start:

```typescript
loadTile(tileId, { lod, properties, signal });
```

Large loops on the main thread must be **sliceable**. A bare `for` loop with no yield makes `AbortSignal` uselessyou still wait until the loop finishes.

---

### Resource Budget: The System Must Know Its Limits

Large-scale systems cannot rely on "load as much as possible." They need explicit budgets:

```typescript
interface ResourceBudget {
  maxCpuMemoryBytes: number;
  maxGpuMemoryBytes: number;
  maxConcurrentRequests: number;
  maxWorkers: number;
  maxUploadBytesPerFrame: number;
  targetFrameTimeMs: number;
}
```

The scheduler uses the budget to decide:

- GPU memory nearly full  evict distant tiles
- Frame rate drops  pause high-LOD refinement
- User dragging camera  load low LOD only
- User idle for 300 ms  start high-LOD loads
- Current property too large  load histogram + coarse values first
- Low device memory  reduce tile cache size automatically

Systems without budgets tend to work on dev machines and **freeze on customer hardware**.

---

### Degradation: Incomplete but Usable

A good large-scale 3D system does not aim for full precision immediately. It prioritizes **interactive usability**.

Common degradation strategies:

- Show bounding boxes / coarse shell first
- Show low LOD first, then refine
- While dragging, hide internal cells and show shell only
- Reduce transparency quality or disable expensive filters
- Over memory budget  disable some property filters
- Disable skeleton / edge mesh by default at scale
- On property switch, show low-res property first, then high-res
- Load full cells only for selected regions
- Use aggregate values for distant tiles
- On weak devices, show that the app is in **performance mode**

These strategies fit engineering reality better than "all or nothingsuccess or freeze."


---

## Summary

| Concern | Bad pattern | Good pattern |
|---------|-------------|--------------|
| Data intake | Full `Float32Array` upfront | Async tile/property requests |
| Spatial org | One monolithic grid | Independent spatial blocks |
| Distance | Same detail everywhere | Hierarchical LOD |
| Loading trigger | Load everything | Camera-driven scheduler |
| GPU | Implicit / ignored | Explicit pools, queues, budgets |
| Properties | All at once | Stream geometry first, properties on demand |
| Backend | Locked to one library | Scheduler + pluggable render backend |
| UX | Binary loading flag | Progressive, budget-aware status |
| Failure mode | All or freeze | Degrade gracefully, stay interactive |
