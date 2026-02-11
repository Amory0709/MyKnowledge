'use client'

import { useEffect, useRef } from 'react'
import type { KnowledgeEntry } from '@/types'

interface ThreeGardenProps {
  entries: KnowledgeEntry[]
  onEntryClick: (id: string) => void
  searchFilter: string
  lang: 'zh' | 'en'
}

// ── Cloud Shaders (Volumetric Ray Marching) ──────────────────────────────
const cloudVert = `
varying vec3 vWorldPos;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const cloudFrag = `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uCamPos;

varying vec3 vWorldPos;
varying vec2 vUv;

// FBM Noise
float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p.zxy, p.yxz + 19.19);
  return fract(p.x * p.y * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
        mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
        mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
  f.z);
}

float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = p * 2.0 + shift + uTime * 0.012;
    a *= 0.5;
  }
  return v;
}

float cloudDensity(vec3 p) {
  // Cloud layer height falloff
  float heightFade = smoothstep(0.0, 0.4, (p.y - 18.0) / 12.0) *
                     smoothstep(0.0, 0.3, 1.0 - (p.y - 18.0) / 20.0);
  if (heightFade < 0.001) return 0.0;
  
  float d = fbm(p * 0.045) - 0.42;
  return max(0.0, d * heightFade * 2.2);
}

void main() {
  // Ray setup
  vec3 ro = uCamPos;
  vec3 rd = normalize(vWorldPos - uCamPos);
  
  if (rd.y < 0.01) { gl_FragColor = vec4(0.0); return; }
  
  // March through cloud volume
  float tMin = (18.0 - ro.y) / rd.y;
  float tMax = (38.0 - ro.y) / rd.y;
  if (tMin < 0.0) tMin = 0.0;
  if (tMax < tMin) { gl_FragColor = vec4(0.0); return; }
  tMax = min(tMax, tMin + 80.0);
  
  int STEPS = 32;
  float dt = (tMax - tMin) / float(STEPS);
  float transmittance = 1.0;
  vec3 scatteredLight = vec3(0.0);
  
  vec3 sunColor = vec3(1.0, 0.95, 0.88);
  vec3 skyColor = vec3(0.52, 0.72, 0.92);
  
  for (int i = 0; i < 32; i++) {
    float t = tMin + (float(i) + 0.5) * dt;
    vec3 p = ro + rd * t;
    
    float density = cloudDensity(p);
    if (density < 0.001) continue;
    
    // Beer-Lambert extinction
    float extinction = density * 1.8;
    float stepTransmittance = exp(-extinction * dt);
    
    // Light scattering (sun + sky)
    float lightDensity = cloudDensity(p + uSunDir * 3.0) + cloudDensity(p + uSunDir * 6.0) * 0.5;
    float lightTransmittance = exp(-lightDensity * 2.5);
    
    // Phase function (Henyey-Greenstein approximation)
    float cosTheta = dot(rd, uSunDir);
    float g = 0.65;
    float phase = (1.0 - g*g) / (4.0*3.14159 * pow(1.0 + g*g - 2.0*g*cosTheta, 1.5));
    phase = mix(0.25, phase, 0.6);
    
    vec3 cloudColor = sunColor * lightTransmittance * phase * 2.5 + skyColor * 0.3;
    cloudColor = mix(cloudColor, vec3(0.88, 0.92, 0.96), 0.15); // Ambient
    
    scatteredLight += transmittance * cloudColor * density * dt * (1.0 - stepTransmittance) / extinction;
    transmittance *= stepTransmittance;
    
    if (transmittance < 0.02) break;
  }
  
  float alpha = 1.0 - transmittance;
  if (alpha < 0.01) { gl_FragColor = vec4(0.0); return; }
  
  gl_FragColor = vec4(scatteredLight / max(alpha, 0.001), alpha * 0.92);
}
`

// ── Mountain Shaders ──────────────────────────────────────────────────────
const mountainVert = `
attribute float displacement;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vHeight;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec3 newPos = position + normal * displacement;
  vHeight = newPos.y;
  vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const mountainFrag = `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vHeight;
uniform vec3 uSunDir;
uniform float uMaxHeight;

void main() {
  // Base rock color
  vec3 rock = mix(vec3(0.25, 0.22, 0.18), vec3(0.42, 0.38, 0.32), clamp(vHeight / uMaxHeight, 0.0, 1.0));
  // Forest green on lower slopes
  vec3 forest = vec3(0.18, 0.32, 0.14);
  float forestMix = smoothstep(0.15, 0.35, vHeight / uMaxHeight);
  vec3 terrain = mix(forest, rock, forestMix);
  // Snow above a certain height
  float snowLine = 0.65;
  float snowMix = smoothstep(snowLine - 0.05, snowLine + 0.1, vHeight / uMaxHeight);
  // Snow accumulates on flatter surfaces
  float slope = dot(vNormal, vec3(0.0, 1.0, 0.0));
  snowMix *= smoothstep(0.3, 0.7, slope);
  vec3 snow = vec3(0.94, 0.97, 1.0);
  vec3 color = mix(terrain, snow, snowMix);
  // Lighting
  float diffuse = max(0.0, dot(vNormal, uSunDir));
  vec3 ambient = vec3(0.35, 0.42, 0.55);
  color = color * (ambient + diffuse * vec3(1.0, 0.95, 0.85) * 1.2);
  gl_FragColor = vec4(color, 1.0);
}
`

export function ThreeGarden({ entries, onEntryClick, searchFilter, lang }: ThreeGardenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    async function init() {
      const THREE = await import('three')
      const { Sky } = await import('three/addons/objects/Sky.js')

      const container = containerRef.current!
      const w = container.clientWidth, h = container.clientHeight

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      container.appendChild(renderer.domElement)

      // Scene & Camera
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0xc8dff5, 0.005)

      // Camera: standing in the meadow, looking up at mountain (matches reference photo)
      const camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 2000)
      camera.position.set(0, 2.5, 48)
      camera.lookAt(0, 18, 0)

      // ── Sky ──
      const sky = new Sky()
      sky.scale.setScalar(1000)
      scene.add(sky)
      const skyUniforms = sky.material.uniforms
      skyUniforms['turbidity'].value = 4
      skyUniforms['rayleigh'].value = 1.2
      skyUniforms['mieCoefficient'].value = 0.008
      skyUniforms['mieDirectionalG'].value = 0.82
      const sunAngle = Math.PI / 5.5
      const sunDir = new THREE.Vector3(
        Math.cos(sunAngle) * 0.5, Math.sin(sunAngle), Math.cos(sunAngle) * 0.3
      ).normalize()
      skyUniforms['sunPosition'].value.copy(sunDir.clone().multiplyScalar(500))

      // ── Lighting ──
      const sun = new THREE.DirectionalLight(0xfff5e0, 3.5)
      sun.position.copy(sunDir.clone().multiplyScalar(100))
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.near = 0.5
      sun.shadow.camera.far = 300
      sun.shadow.camera.left = -80
      sun.shadow.camera.right = 80
      sun.shadow.camera.top = 80
      sun.shadow.camera.bottom = -80
      scene.add(sun)
      scene.add(new THREE.AmbientLight(0x8ab4d8, 1.2))
      scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4a7a3a, 0.8))

      // ── Mountain ──
      const mRes = 220
      // Wider and deeper terrain to fill the view
      const mGeo = new THREE.PlaneGeometry(240, 220, mRes - 1, mRes - 1)
      mGeo.rotateX(-Math.PI / 2)
      const positions = mGeo.attributes.position.array as Float32Array
      const dispArr = new Float32Array(positions.length / 3)
      const maxH = 72 // Taller mountain

      function snoise(x: number, z: number, octaves = 6): number {
        let v = 0, a = 1, f = 1, max = 0
        for (let i = 0; i < octaves; i++) {
          const px = Math.sin(x * f * 0.7 + 1.3) * Math.cos(z * f * 0.5 + 2.1)
          const pz = Math.sin(z * f * 0.6 + 0.9) * Math.cos(x * f * 0.8 + 1.7)
          v += ((px + pz) * 0.5 + 0.5) * a
          max += a; a *= 0.55; f *= 2.1
        }
        return v / max
      }

      for (let i = 0; i < dispArr.length; i++) {
        const vx = positions[i * 3], vz = positions[i * 3 + 2]
        // Mountain centered slightly behind (negative z = further back)
        const mz = vz + 20 // shift mountain center backward
        const dist = Math.sqrt(vx * vx * 0.8 + mz * mz) / 55
        const mountain = Math.max(0, 1 - dist * dist * 0.9) * snoise(vx * 0.032, mz * 0.032, 8)
        const detail = snoise(vx * 0.1, vz * 0.1, 4) * 0.12
        // Flatten the foreground (where camera/meadow is)
        const foregroundFlatten = Math.max(0, (vz - 15) / 30) // flat from z=15 onward
        dispArr[i] = Math.max(0, (mountain - foregroundFlatten * 0.7 + detail)) * maxH
        positions[i * 3 + 1] = dispArr[i]
      }
      mGeo.computeVertexNormals()
      mGeo.setAttribute('displacement', new THREE.BufferAttribute(dispArr, 1))

      const mMat = new THREE.ShaderMaterial({
        vertexShader: mountainVert,
        fragmentShader: mountainFrag,
        uniforms: {
          uSunDir: { value: sunDir },
          uMaxHeight: { value: maxH },
        },
      })
      const mountain = new THREE.Mesh(mGeo, mMat)
      mountain.receiveShadow = true
      mountain.castShadow = true
      scene.add(mountain)

      // ── Volumetric Clouds ──
      const cloudGeo = new THREE.PlaneGeometry(600, 600, 1, 1)
      cloudGeo.rotateX(-Math.PI / 2)
      cloudGeo.translate(0, 28, 0)
      const cloudMat = new THREE.ShaderMaterial({
        vertexShader: cloudVert,
        fragmentShader: cloudFrag,
        uniforms: {
          uTime: { value: 0 },
          uSunDir: { value: sunDir },
          uCamPos: { value: camera.position },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      scene.add(new THREE.Mesh(cloudGeo, cloudMat))

      // ── Wildflower Meadow (Instanced) ──
      function seeded(n: number) {
        const x = Math.sin(n * 9301 + 49297) * 233280
        return x - Math.floor(x)
      }

      const stemGeo = new THREE.CylinderGeometry(0.02, 0.03, 1.2, 4)
      const petalGeo = new THREE.SphereGeometry(0.18, 6, 4)
      const FLOWER_COUNT = 400
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a7a28, roughness: 0.9 })

      const flowerColors = [0x6B9FD4, 0xB08FE8, 0xF5F5F5, 0xF5D060, 0xFF90B0]
      const flowerMats = flowerColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }))

      for (let i = 0; i < FLOWER_COUNT; i++) {
        // Spread across the foreground meadow in front of camera
        const fx = (seeded(i * 7) - 0.5) * 90
        // Z: mostly in front of camera (z=20 to z=50), with some further back
        const fz = 18 + seeded(i * 11) * 32
        // Sample height — foreground is fairly flat
        const mz = fz + 20
        const distSample = Math.sqrt(fx * fx * 0.8 + mz * mz) / 55
        const foregroundFlatten = Math.max(0, (fz - 15) / 30)
        const heightSample = snoise(fx * 0.032, mz * 0.032, 8)
        const fy = Math.max(0, (Math.max(0, 1 - distSample * distSample * 0.9) * heightSample - foregroundFlatten * 0.7) * maxH)

        if (fy > maxH * 0.4) continue // Don't place on steep slopes

        const stem = new THREE.Mesh(stemGeo, stemMat)
        stem.position.set(fx, fy + 0.6, fz)
        stem.castShadow = false
        scene.add(stem)

        const colorIdx = Math.floor(seeded(i * 13) * flowerColors.length)
        const petal = new THREE.Mesh(petalGeo, flowerMats[colorIdx])
        petal.position.set(fx, fy + 1.3, fz)
        petal.scale.y = 0.5
        scene.add(petal)
      }

      // ── Knowledge Flowers ──
      const CATEGORY_COLORS_3D: Record<string, number> = {
        '计算机科学': 0x00E5FF,
        '算法': 0xBB80FF,
        '数学': 0xFFD700,
      }
      const DEFAULT_3D = 0xFFB7C5

      const knowledgeFlowers: Array<{
        entry: KnowledgeEntry
        mesh: THREE.Group
        basePos: THREE.Vector3
        color: number
      }> = []

      const stemGeoK = new THREE.CylinderGeometry(0.04, 0.06, 2.5, 6)
      const petalGeoK = new THREE.SphereGeometry(0.55, 8, 6)
      const centerGeoK = new THREE.SphereGeometry(0.22, 8, 8)

      entries.forEach((entry, i) => {
        const seed = entry.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        // Spread knowledge flowers across foreground meadow, left to right
        const spread = 0.05 + (i / Math.max(entries.length - 1, 1)) * 0.90
        const fx = (spread - 0.5) * 80 + (seeded(seed + 1) - 0.5) * 10
        const fz = 22 + seeded(seed + 2) * 20 // In the meadow, in front

        const mzS = fz + 20
        const distS = Math.sqrt(fx * fx * 0.8 + mzS * mzS) / 55
        const foregroundFlattenS = Math.max(0, (fz - 15) / 30)
        const heightS = snoise(fx * 0.032, mzS * 0.032, 8)
        const fy = Math.max(0, (Math.max(0, 1 - distS * distS * 0.9) * heightS - foregroundFlattenS * 0.7) * maxH)

        const color = CATEGORY_COLORS_3D[entry.category] ?? DEFAULT_3D
        const group = new THREE.Group()

        const stemM = new THREE.Mesh(stemGeoK, new THREE.MeshStandardMaterial({ color: 0x2a6a1a, roughness: 0.8 }))
        stemM.position.y = 1.25
        group.add(stemM)

        const PETAL_COUNT = 6
        for (let p = 0; p < PETAL_COUNT; p++) {
          const pa = (p / PETAL_COUNT) * Math.PI * 2
          const pm = new THREE.Mesh(petalGeoK, new THREE.MeshStandardMaterial({
            color, roughness: 0.5, metalness: 0.1, emissive: color, emissiveIntensity: 0.15,
          }))
          pm.position.set(Math.cos(pa) * 0.6, 2.7, Math.sin(pa) * 0.6)
          pm.scale.set(1, 0.4, 0.8)
          group.add(pm)
        }

        const centerM = new THREE.Mesh(centerGeoK, new THREE.MeshStandardMaterial({
          color: 0xFFF9E0, roughness: 0.3, emissive: 0xFFFFAA, emissiveIntensity: 0.3,
        }))
        centerM.position.y = 2.7
        group.add(centerM)

        group.position.set(fx, fy, fz)
        const basePos = new THREE.Vector3(fx, fy, fz)
        scene.add(group)
        knowledgeFlowers.push({ entry, mesh: group, basePos, color })
      })

      // ── Raycasting for hover/click ──
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2(-99, -99)
      let hoveredIdx = -1

      const onMouseMove = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      }
      const onClick = () => {
        if (hoveredIdx >= 0) onEntryClick(knowledgeFlowers[hoveredIdx].entry.id)
      }

      renderer.domElement.addEventListener('mousemove', onMouseMove)
      renderer.domElement.addEventListener('click', onClick)

      // ── Gentle camera sway ──
      const clock = new THREE.Clock()

      function animate() {
        if (destroyed) return
        requestAnimationFrame(animate)
        const t = clock.getElapsedTime()

        // Cloud time
        cloudMat.uniforms.uTime.value = t
        cloudMat.uniforms.uCamPos.value.copy(camera.position)

        // Camera: gentle drift at meadow level, looking up at mountain
        camera.position.x = Math.sin(t * 0.03) * 1.8
        camera.position.y = 2.5 + Math.sin(t * 0.05) * 0.3
        camera.lookAt(Math.sin(t * 0.025) * 1.2, 18, 0)

        // Raycasting for knowledge flowers
        raycaster.setFromCamera(mouse, camera)
        const allMeshes = knowledgeFlowers.map(f => f.mesh.children).flat() as THREE.Mesh[]
        const hits = raycaster.intersectObjects(allMeshes, false)
        
        let newHovered = -1
        if (hits.length > 0) {
          const hitObj = hits[0].object
          const idx = knowledgeFlowers.findIndex(f => f.mesh.children.includes(hitObj))
          if (idx >= 0) newHovered = idx
        }

        // Update hover states
        knowledgeFlowers.forEach((f, i) => {
          const isHovered = i === newHovered
          const isFiltered = searchFilter.length > 0 &&
            !f.entry.title.includes(searchFilter) &&
            !(f.entry.titleEn ?? '').toLowerCase().includes(searchFilter.toLowerCase())

          const targetScale = isHovered ? 1.45 : 1.0
          f.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12)

          // Gentle sway
          f.mesh.rotation.z = Math.sin(t * 0.8 + f.basePos.x * 0.3) * 0.06
          
          // Emissive pulse on hover
          f.mesh.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              if (child.material.emissive.getHex() !== 0xFFFFF0) {
                const pulse = isHovered ? 0.25 + Math.sin(t * 4) * 0.1 : 0.15
                child.material.emissiveIntensity = pulse
              }
            }
          })

          // Opacity for filtered
          f.mesh.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.opacity = isFiltered ? 0.2 : 1.0
              child.material.transparent = isFiltered
            }
          })
        })

        hoveredIdx = newHovered
        renderer.domElement.style.cursor = newHovered >= 0 ? 'pointer' : 'default'

        renderer.render(scene, camera)
      }
      animate()

      // Resize
      const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      sceneRef.current = {
        destroy: () => {
          destroyed = true
          renderer.domElement.removeEventListener('mousemove', onMouseMove)
          renderer.domElement.removeEventListener('click', onClick)
          window.removeEventListener('resize', onResize)
          renderer.dispose()
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        }
      }
    }

    init().catch(console.error)
    return () => { sceneRef.current?.destroy() }
  }, [entries, onEntryClick, searchFilter, lang])

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
    />
  )
}
