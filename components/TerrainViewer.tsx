'use client'

import { useEffect, useRef, useState } from 'react'

interface MountainMeta {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  radiusKm: number
  minElevation: number
  maxElevation: number
  resolution: number
}

interface TerrainViewerProps {
  mountainId: string
  onBack?: () => void
}

// ── Category colors & emoji ──
const CATEGORY_STYLE: Record<string, { color: number; emoji: string; colorHex: string }> = {
  '编程': { color: 0x00e5ff, emoji: '💻', colorHex: '#00E5FF' },
  '财务': { color: 0xffd700, emoji: '💰', colorHex: '#FFD700' },
  '数学': { color: 0xbb80ff, emoji: '🔢', colorHex: '#BB80FF' },
  '设计': { color: 0xff90b0, emoji: '🎨', colorHex: '#FF90B0' },
  '人文': { color: 0x80cbc4, emoji: '📚', colorHex: '#80CBC4' },
  '社交': { color: 0xff8a65, emoji: '🤝', colorHex: '#FF8A65' },
  '修身': { color: 0xce93d8, emoji: '🧘', colorHex: '#CE93D8' },
}

// ── Terrain coloring shader ──
const terrainVert = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vHeight = position.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const terrainFrag = `
uniform vec3 uSunDir;
uniform float uMaxHeight;
uniform vec3 uAccentColor;
uniform vec3 uCamPos;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;

void main() {
  float hNorm = clamp(vHeight / uMaxHeight, 0.0, 1.0);

  // Base terrain color gradient (green → brown → rock → snow)
  vec3 lowland = vec3(0.22, 0.42, 0.18);   // Green valleys
  vec3 forest  = vec3(0.15, 0.32, 0.12);   // Dark forest
  vec3 rock    = vec3(0.45, 0.40, 0.35);   // Rocky
  vec3 snow    = vec3(0.95, 0.97, 1.0);    // Snow

  vec3 terrain;
  if (hNorm < 0.25) {
    terrain = mix(lowland, forest, hNorm / 0.25);
  } else if (hNorm < 0.5) {
    terrain = mix(forest, rock, (hNorm - 0.25) / 0.25);
  } else if (hNorm < 0.75) {
    terrain = mix(rock, snow, (hNorm - 0.5) / 0.25);
  } else {
    terrain = snow;
  }

  // Snow on flat surfaces at high elevation
  float slope = dot(vNormal, vec3(0.0, 1.0, 0.0));
  float snowF = smoothstep(0.5, 0.8, hNorm) * smoothstep(0.3, 0.7, slope);
  terrain = mix(terrain, snow, snowF * 0.6);

  // Subtle accent tint based on category
  terrain = mix(terrain, uAccentColor, 0.08);

  // Lighting
  float diff = max(0.0, dot(vNormal, uSunDir));
  vec3 ambient = vec3(0.35, 0.40, 0.50);
  terrain = terrain * (ambient + diff * vec3(1.0, 0.95, 0.85) * 1.2);

  // Atmospheric haze
  float dist = length(vWorldPos - uCamPos);
  float haze = 1.0 - exp(-dist * 0.003);
  vec3 hazeColor = vec3(0.65, 0.78, 0.92);
  terrain = mix(terrain, hazeColor, haze * 0.4);

  gl_FragColor = vec4(terrain, 1.0);
}
`

// ── Pedestal (base slab) shader ──
const pedestalVert = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const pedestalFrag = `
varying vec3 vWorldPos;

void main() {
  // Clean museum-style pedestal
  vec3 color = vec3(0.88, 0.87, 0.85);
  // Subtle striation lines
  float stripe = abs(sin(vWorldPos.y * 40.0)) * 0.03;
  color -= stripe;
  gl_FragColor = vec4(color, 1.0);
}
`

export function TerrainViewer({ mountainId, onBack }: TerrainViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [meta, setMeta] = useState<MountainMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    async function init() {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')
      const basePath = process.env.DEPLOY ? '/MyKnowledge' : ''

      // Load mountain metadata
      const metaRes = await fetch(`${basePath}/terrain/${mountainId}.json`)
      const mountainMeta: MountainMeta = await metaRes.json()
      if (destroyed) return
      setMeta(mountainMeta)

      // Load heightmap image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = `${basePath}/terrain/${mountainId}.png`
      })
      if (destroyed) return

      // Extract elevation data from image
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const pixels = imageData.data

      const container = containerRef.current!
      const w = container.clientWidth
      const h = container.clientHeight

      // ── Renderer ──
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.setClearColor(0xf0f0f0, 1)
      container.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0xe8e8e8, 200, 600)

      // ── Terrain geometry ──
      const terrainSize = 100 // World units
      const segments = Math.min(img.width - 1, 255) // Max segments
      const heightScale = terrainSize * 0.3 // Vertical exaggeration
      const elevRange = mountainMeta.maxElevation - mountainMeta.minElevation || 1

      const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments)
      geo.rotateX(-Math.PI / 2)

      const positions = geo.attributes.position.array as Float32Array
      const verticesPerSide = segments + 1

      for (let iy = 0; iy < verticesPerSide; iy++) {
        for (let ix = 0; ix < verticesPerSide; ix++) {
          const vi = iy * verticesPerSide + ix

          // Sample the heightmap
          const px = Math.floor((ix / segments) * (img.width - 1))
          const py = Math.floor((iy / segments) * (img.height - 1))
          const pi = (py * img.width + px) * 4
          const gray = pixels[pi] // R channel (grayscale)

          const normalizedHeight = gray / 255
          positions[vi * 3 + 1] = normalizedHeight * heightScale
        }
      }

      geo.computeVertexNormals()

      // ── Terrain material ──
      const style = CATEGORY_STYLE[mountainMeta.category] || CATEGORY_STYLE['编程']
      const sunDir = new THREE.Vector3(0.5, 0.8, 0.3).normalize()

      const terrainMat = new THREE.ShaderMaterial({
        vertexShader: terrainVert,
        fragmentShader: terrainFrag,
        uniforms: {
          uSunDir: { value: sunDir },
          uMaxHeight: { value: heightScale },
          uAccentColor: { value: new THREE.Color(style.color) },
          uCamPos: { value: new THREE.Vector3() },
        },
      })

      const terrain = new THREE.Mesh(geo, terrainMat)
      terrain.castShadow = true
      terrain.receiveShadow = true
      scene.add(terrain)

      // ── Pedestal (museum slab effect) ──
      const pedestalHeight = heightScale * 0.15
      const pedestalGeo = new THREE.BoxGeometry(terrainSize + 2, pedestalHeight, terrainSize + 2)
      const pedestalMat = new THREE.ShaderMaterial({
        vertexShader: pedestalVert,
        fragmentShader: pedestalFrag,
      })
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
      pedestal.position.y = -pedestalHeight / 2
      scene.add(pedestal)

      // ── Lighting ──
      const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5)
      dirLight.position.copy(sunDir.clone().multiplyScalar(200))
      dirLight.castShadow = true
      dirLight.shadow.mapSize.set(2048, 2048)
      dirLight.shadow.camera.near = 1
      dirLight.shadow.camera.far = 500
      dirLight.shadow.camera.left = -80
      dirLight.shadow.camera.right = 80
      dirLight.shadow.camera.top = 80
      dirLight.shadow.camera.bottom = -80
      scene.add(dirLight)
      scene.add(new THREE.AmbientLight(0x9bb8d8, 0.8))
      scene.add(new THREE.HemisphereLight(0xc8dff0, 0x4a6340, 0.5))

      // ── Camera ──
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 2000)
      camera.position.set(terrainSize * 0.6, terrainSize * 0.5, terrainSize * 0.6)
      camera.lookAt(0, heightScale * 0.3, 0)

      // ── Controls ──
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, heightScale * 0.3, 0)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.rotateSpeed = 0.5
      controls.zoomSpeed = 0.8
      controls.minDistance = 20
      controls.maxDistance = 300
      controls.maxPolarAngle = Math.PI * 0.45

      setLoading(false)

      // ── Auto-rotate ──
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.5

      // Stop auto-rotate on interaction
      const stopAutoRotate = () => { controls.autoRotate = false }
      renderer.domElement.addEventListener('pointerdown', stopAutoRotate)

      // ── Animation ──
      function animate() {
        if (destroyed) return
        requestAnimationFrame(animate)
        controls.update()
        terrainMat.uniforms.uCamPos.value.copy(camera.position)
        renderer.render(scene, camera)
      }
      animate()

      // ── Resize ──
      const onResize = () => {
        const nw = container.clientWidth
        const nh = container.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      cleanupRef.current = () => {
        destroyed = true
        controls.dispose()
        renderer.domElement.removeEventListener('pointerdown', stopAutoRotate)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    }

    init().catch(console.error)
    return () => { cleanupRef.current?.() }
  }, [mountainId])

  const style = meta ? CATEGORY_STYLE[meta.category] : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#f0f0f0' }}>
      {/* Header overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 24px',
        background: 'linear-gradient(to bottom, rgba(240,240,240,0.95), rgba(240,240,240,0))',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'white', border: '1px solid #ddd', borderRadius: 8,
                padding: '6px 14px', cursor: 'pointer', fontSize: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              ← 返回
            </button>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#222' }}>
              {style?.emoji} {meta?.name || '加载中...'}
            </h2>
            {meta && (
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>
                {meta.category} · {meta.minElevation}m – {meta.maxElevation}m ·
                {meta.radiusKm}km 范围
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f0f0f0',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏔️</div>
            <p style={{ color: '#888', fontSize: 14 }}>正在加载地形数据...</p>
          </div>
        </div>
      )}

      {/* Info card */}
      {meta && !loading && (
        <div style={{
          position: 'absolute', bottom: 20, right: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
          borderRadius: 12, padding: '14px 18px', maxWidth: 220,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: `2px solid ${style?.colorHex || '#ddd'}`,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>📍 GPS</p>
          <p style={{ margin: '2px 0 8px', fontSize: 13, color: '#444' }}>
            {meta.lat.toFixed(3)}°, {meta.lng.toFixed(3)}°
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>⛰️ 高差</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#444' }}>
            {meta.maxElevation - meta.minElevation}m
          </p>
        </div>
      )}

      {/* Three.js container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
