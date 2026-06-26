# LOD

> Imported from [WellboreInsights ADO Wiki](https://dev.azure.com/slb1-swt/eebf2c16-7d03-42da-aaad-9acf7a217907/_wiki/wikis/af524b9b-214c-4897-b44b-eb65fe83b5f2?pagePath=%2FWBI%20Core%2FWBI%20Computation%20%26%20Data%20Visualization%2F2%20-%203D%20Visualization%2FProject%20Design%2FLarge%20Object%20Display%2FFrontend%203D%20Display%20Limitation%20Investigation%2FAlgorithm%2FLOD) on 2026-06-26.

## LOD Capacity Analysis

  

LOD means lower levels of detail represent the same source area with fewer samples.

  

For volume data, each LOD level usually halves resolution on each axis.

  

```text

LOD 0 = full resolution

LOD 1 = 1/2 resolution per axis = 1/8 samples

LOD 2 = 1/4 resolution per axis = 1/64 samples

LOD 3 = 1/8 resolution per axis = 1/512 samples

```

  

### LOD Formula

  

Let:

  

```text

lodLevel = L

downsampleFactorPerAxis = 2^L

sampleReduction = 8^L

sourceSamplesRepresented = activeSampleCount * 8^L

```

  

### LOD-Only Capacity With 2GB GPU Cache

  

Assuming R16 samples:

  

```text

activeSampleCount = 2GB / 2 bytes = ~1.07B active samples

```

  

- LOD 0:

á - Sample reduction: 1x

á - Source samples represented: approximately 1.07B

á - Equivalent source cube: approximately 1024│

- LOD 1:

á - Sample reduction: 8x

á - Source samples represented: approximately 8.59B

á - Equivalent source cube: approximately 2048│

- LOD 2:

á - Sample reduction: 64x

á - Source samples represented: approximately 68.7B

á - Equivalent source cube: approximately 4096│

- LOD 3:

á - Sample reduction: 512x

á - Source samples represented: approximately 550B

á - Equivalent source cube: approximately 8192│

  

Conclusion:

  

> LOD can make the browser display an overview of a much larger source volume, but the displayed data is lower resolution.

  

For a 10GB R16 seismic dataset:

  

```text

sourceSamples = 10GB / 2 bytes = ~5.37B samples

```

  

LOD coverage with 2GB GPU cache:

  

- LOD 0: No. Only about 20% of the full-resolution source fits.

- LOD 1: Yes. The whole source can fit as a half-resolution-per-axis overview.

- LOD 2: Yes. The whole source fits with much more headroom, but with lower detail.

- LOD 3: Yes. The whole source fits easily as a very coarse overview.
