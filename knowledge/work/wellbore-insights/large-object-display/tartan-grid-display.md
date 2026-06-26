# Tartan Grid display

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FTartan%20Grid%20display) on 2026-06-26.

Material provided by Lydia: [[2026][Q1][DRE][3DGC] Tartan Grid - Overview](https://dev.azure.com/slb1-swt/WellboreInsights/_wiki/wikis/WellboreInsights.wiki/34523/-2026-Q1-DRE-3DGC-Tartan-Grid)

# Requirement Clarification Meeting:
[Subject requirement clarification for `Tartan Grid` display.loop](https://slb001-my.sharepoint.com/:fl:/r/personal/mhan8_slb_com/Documents/Meetings/Subject%20requirement%20clarification%20for%20%60Tartan%20Grid%60%20display.loop?d=wffe645bdfba64a03b0b64866427e0434&csf=1&web=1&e=9Gbnh1&nav=cz0lMkZwZXJzb25hbCUyRm1oYW44X3NsYl9jb20mZD1iJTIxY0NYMXZhaWl2azJKcnFNR1lYcDhVSTNvakpjT21LNUN0UG1la1ZrcEU1eW5meXhZZE1XdFQ3Y2l5ekdTVzV5OSZmPTAxWVgyS1Y3RjVJWFRQN0pYM0FORkxCTlNJTVpCSDRCQlUmYz0lMkYmYT1Mb29wQXBwJnA9JTQwZmx1aWR4JTJGbG9vcC1wYWdlLWNvbnRhaW5lcg%3D%3D)
*   Workflow: 3DGC generated Tartan Grid. DRE use the Tartan Grid to simulate some property.
    *   DRE will generate static Tartan Grid - one or more properties that doesn't change (current goal), ideal maximum size will be 13~14 millions of Grid
    *   DRE will generate dynamic Tartan Grid - one or more properties that changes over time.
        1.  The time change of the dynamic Tartan Grid is defined by steps. One step may takes 1 minute, 5 minutes and etc.
        2.  Normally one simulation result has 30~40 steps. The extreme case is tens of steps. But definitely less than 100 steps.
        3.  One step corresponds to one set of static Tartan Grid properties
        4.  Dynamic Tartan Grid is not real-time data, it occurs in one simulation result all at once
        5.  File Type
        6.  ![==image_0==.png](/.attachments/==image_0==-73335f88-5ee6-4ea4-963e-788cb1cbf1e5.png) 
*   System Integration: Where to put the simulation result? (TBD - need more discussion)
*   Required functions for Tartan Grid from DRE
    
        1.  Switch displayed property
        2.  Switch color map
        3.  Control the Mesh/Grid display
        4.  Apply IJK filters, XYZ filters, property filters to the model
        5.  Intersection tool (FUTURE)
        6.  Probe tool (FUTURE: check the grid xyz and property value with cursor)
        7.  Need to display two 3D View inside the same page at the same time with sync viewport
    
*   FUTURE: 3D calculator, use 3D model to calculate properties

For visualization solution:
1. Support the colormap
2. Support the toggle for mesh display and skeleton/grid/wireline display
2. It is ok to only show the skin, and do not allow user to go inside the mode
3. Apply IJK filters, XYZ filters, property filters to the model
4. Intersection Tool
5. Picking Tool for one cell
6. Visualize 20M of cells

# File Size Analytics

Example file: **Tartan_no_fault_8.9M RESQML**
Total: ~1.03 GiB

Dimension: [197, 206, 221]

points = 197 * 206 * 221 = 8,968,622
cells  = 196 * 205 * 220 = 8,839,600

```
.h5 + .epc = Standard RESQML Data
.xyz       = Additional text about vertices(points)/attribute/indexes, not required
```

- tartan_strati_ijk.xyz                         781.46 MiB // text-based storage format
    *   `x/y/z`value in text367.79 MiB
        *   `x`: 128.30 MiB
        *   `y`: 128.30 MiB
        *   `z`: 111.19 MiB
    *   `prop`property in text85.15 MiB
        *   most`nan`
    *   `i/j/k`index in text268.65 MiB
        *   `i`: 89.31 MiB
        *   `j`: 89.52 MiB
        *   `k`: 89.83 MiB
    *   separator /new linearound 59.87 MiB
- 2026_04_21_tartan_no_fault_8.9M.h5            272.72 MiB // structured binary storage format
    *   `IjkGridRepresentation / Points`:around 205.28 MiB
        *   estimation`8,968,622 points * 3 coords * 8 bytes`
        *   This is the main geometry data in HDF5, which is the`x/y/z` of the grid
    *   `ContinuousProperty / Structural Cube`:around 67.44 MiB
        *   stimation`8,839,600 cells * 8 bytes`
        *   This is the cell property
    *   `DiscreteProperty / Structural Layers`:very small/compressed
        *   `.epc`has the reference to this property from HDF, but referenced from the total size of`.h5`, it cannot be complete/uncompressed int32 cell arrayotherwise it will be33.72 MiB larger
    *   horizon/sub-representation indicesvery small, around 1B
        *   `.epc`has many horizon representationsbut they are relatively small compared with grid points and full cell property
- 2026_04_21_tartan_no_fault_8.9M.epc             0.03 MiB
- tartan_strati_ijk_dimension.json                ~0 MiB

### Estimated 20M Model Size

*   `tartan_strati_ijk.xyz`~1.70 GiB
    *   `x/y/z`value in text:~820.0 MiB
        *   `x`: ~286.2 MiB
        *   `y`: ~286.2 MiB
        *   `z`: ~248.0 MiB
    *   `prop`property in text:~189.9 MiB
        *   mostly`nan`, assuming same pattern
    *   `i/j/k`index in text:~599.2 MiB
        *   `i`: ~199.2 MiB
        *   `j`: ~199.7 MiB
        *   `k`: ~200.4 MiB
    *   separator / new line:~133.5 MiB
*   `2026_04_21_tartan_no_fault_20M.h5`~608.2 MiB
    *   `IjkGridRepresentation / Points`:~457.8 MiB
        *   estimation:`20,000,000 points * 3 coords * 8 bytes`
    *   `ContinuousProperty / Structural Cube`:~150.4 MiB
        *   estimated from current cells/points ratio and`8 bytes`per cell
    *   `DiscreteProperty / Structural Layers`:very small/compressed
        *   if uncompressed int32 for all cells, it would add around75.2 MiB
    *   horizon/sub-representation indices:very small
*   `2026_04_21_tartan_no_fault_20M.epc`~0.03-0.07 MiB
    *   Metadata XML package.
    *   Size may grow slightly if there are more objects, but not with point count in a meaningful way.
*   `tartan_strati_ijk_dimension.json`~0 MiB
    *   Still tiny, only stores dimensions.

# Solution proposal
We can load full data by chunk no matter it is meshless or mesh visualization.
The GPU limitation is good enough to store the grid data fully
Please check https://dev.azure.com/slb1-swt/WellboreInsights/_wiki/wikis/WellboreInsights.wiki/42205/Frontend-3D-Display-Limitation-Investigation
