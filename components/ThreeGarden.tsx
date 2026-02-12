'use client'

import { useEffect, useRef } from 'react'
import type { KnowledgeEntry } from '@/types'

interface ThreeGardenProps {
  entries: KnowledgeEntry[]
  onEntryClick: (id: string) => void
  searchFilter: string
  lang: 'zh' | 'en'
}

// ── Volumetric Cloud Shader ──
const cloudVert = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const cloudFrag = `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uCamPos;

varying vec3 vWorldPos;

float hash(vec3 p) {
  p = fract(p * vec3(443.897, 397.297, 491.187));
  p += dot(p.zxy, p.yxz + 19.19);
  return fract(p.x * p.y * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
    mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
    mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p) {
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.0+vec3(100.)+uTime*0.008;a*=0.5;}
  return v;
}
float cloudDensity(vec3 p) {
  float hFade = smoothstep(0.0,0.4,(p.y-600.0)/200.0)*smoothstep(0.0,0.3,1.0-(p.y-600.0)/350.0);
  if(hFade<0.001) return 0.0;
  return max(0.0, (fbm(p*0.002)-0.40)*hFade*2.5);
}
void main() {
  vec3 rd = normalize(vWorldPos - uCamPos);
  if(rd.y<0.005){gl_FragColor=vec4(0.0);return;}
  float tMin=(600.0-uCamPos.y)/rd.y;
  float tMax=(950.0-uCamPos.y)/rd.y;
  if(tMin<0.0)tMin=0.0;
  if(tMax<tMin){gl_FragColor=vec4(0.0);return;}
  tMax=min(tMax,tMin+2000.0);
  float dt=(tMax-tMin)/28.0;
  float T=1.0;vec3 L=vec3(0.0);
  vec3 sunC=vec3(1.0,0.95,0.88),skyC=vec3(0.52,0.72,0.92);
  for(int i=0;i<28;i++){
    float t=tMin+(float(i)+0.5)*dt;
    vec3 p=uCamPos+rd*t;
    float d=cloudDensity(p);if(d<0.001)continue;
    float ext=d*1.5;float sT=exp(-ext*dt);
    float lD=cloudDensity(p+uSunDir*80.0)*0.7;
    float lT=exp(-lD*2.0);
    float cosA=dot(rd,uSunDir);float g=0.6;
    float ph=(1.0-g*g)/(4.0*3.14159*pow(1.0+g*g-2.0*g*cosA,1.5));
    ph=mix(0.25,ph,0.5);
    vec3 cC=sunC*lT*ph*2.2+skyC*0.35;
    cC=mix(cC,vec3(0.9,0.93,0.97),0.15);
    L+=T*cC*d*dt*(1.0-sT)/ext;T*=sT;
    if(T<0.02)break;
  }
  float a=1.0-T;if(a<0.01){gl_FragColor=vec4(0.0);return;}
  gl_FragColor=vec4(L/max(a,0.001),a*0.88);
}
`

// ── Mountain Shader (with atmospheric perspective) ──
const mtVert = `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vHeight;
void main(){
  vNormal=normalize(normalMatrix*normal);
  vec4 wp=modelMatrix*vec4(position,1.0);
  vWorldPos=wp.xyz;
  vHeight=wp.y;
  gl_Position=projectionMatrix*viewMatrix*wp;
}
`
const mtFrag = `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vHeight;
uniform vec3 uSunDir;
uniform float uSnowLine;
uniform float uPeakHeight;
uniform vec3 uCamPos;

void main(){
  float hNorm=clamp(vHeight/uPeakHeight,0.0,1.0);
  // Rock
  vec3 rock=mix(vec3(0.28,0.24,0.20),vec3(0.50,0.45,0.38),hNorm);
  // Forest on lower slopes
  vec3 forest=vec3(0.16,0.30,0.12);
  float fMix=smoothstep(0.05,0.25,hNorm);
  vec3 terrain=mix(forest,rock,fMix);
  // Snow
  float slope=dot(vNormal,vec3(0,1,0));
  float snowF=smoothstep(uSnowLine-0.03,uSnowLine+0.08,hNorm)*smoothstep(0.25,0.65,slope);
  vec3 snow=vec3(0.95,0.97,1.0);
  vec3 color=mix(terrain,snow,snowF);
  // Lighting
  float diff=max(0.0,dot(vNormal,uSunDir));
  vec3 amb=vec3(0.38,0.45,0.58);
  color=color*(amb+diff*vec3(1.0,0.95,0.85)*1.3);
  // Atmospheric perspective (bluer and hazier with distance)
  float dist=length(vWorldPos-uCamPos);
  float haze=1.0-exp(-dist*0.00035);
  vec3 hazeColor=vec3(0.62,0.74,0.88);
  color=mix(color,hazeColor,haze*0.75);
  gl_FragColor=vec4(color,1.0);
}
`

// ── Ground Shader ──
const groundVert = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main(){
  vUv=uv;
  vec4 wp=modelMatrix*vec4(position,1.0);
  vWorldPos=wp.xyz;
  gl_Position=projectionMatrix*viewMatrix*wp;
}
`
const groundFrag = `
varying vec2 vUv;
varying vec3 vWorldPos;
uniform vec3 uCamPos;

void main(){
  // Lush meadow green, slightly varied
  float n=fract(sin(dot(vUv*80.0,vec2(12.9898,78.233)))*43758.5);
  vec3 grass=mix(vec3(0.30,0.52,0.18),vec3(0.40,0.62,0.22),n*0.5);
  // Darken far edges
  float dist=length(vWorldPos.xz-uCamPos.xz);
  float fade=smoothstep(20.0,200.0,dist);
  grass=mix(grass,vec3(0.22,0.40,0.15),fade*0.4);
  // Atmospheric haze for far ground
  float haze=1.0-exp(-dist*0.002);
  vec3 hazeColor=vec3(0.55,0.68,0.82);
  grass=mix(grass,hazeColor,haze*0.5);
  gl_FragColor=vec4(grass,1.0);
}
`

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

export function ThreeGarden({ entries, onEntryClick, searchFilter, lang }: ThreeGardenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    async function init() {
      const THREE = await import('three')
      const { Sky } = await import('three/addons/objects/Sky.js')
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')

      const container = containerRef.current!
      const w = container.clientWidth, h = container.clientHeight

      // ── Renderer ──
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      container.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      // Atmospheric fog — blue-ish, matching reference photo haze
      scene.fog = new THREE.Fog(0xb0d0ec, 200, 1800)

      // ── Camera — in the meadow, gentle upward look ──
      // 4 layers: sky (top) → mountain → green hills → meadow (bottom)
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.5, 5000)
      camera.position.set(0, 2.5, 0)
      camera.lookAt(0, 25, -300) // Mostly horizontal, slight upward tilt

      // ── OrbitControls — drag to look around, scroll to zoom ──
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, 25, -300)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.enablePan = true
      controls.panSpeed = 0.5
      controls.rotateSpeed = 0.4
      controls.zoomSpeed = 0.8
      controls.minDistance = 1
      controls.maxDistance = 500
      controls.maxPolarAngle = Math.PI * 0.85 // Don't go underground
      controls.minPolarAngle = Math.PI * 0.1  // Don't flip over

      // ── Sky ──
      const sky = new Sky()
      sky.scale.setScalar(4500)
      scene.add(sky)
      const skyU = sky.material.uniforms
      skyU['turbidity'].value = 3.5
      skyU['rayleigh'].value = 1.5
      skyU['mieCoefficient'].value = 0.006
      skyU['mieDirectionalG'].value = 0.8
      const sunDir = new THREE.Vector3(0.4, 0.42, 0.3).normalize()
      skyU['sunPosition'].value.copy(sunDir.clone().multiplyScalar(4000))

      // ── Lighting ──
      const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.0)
      sunLight.position.copy(sunDir.clone().multiplyScalar(500))
      sunLight.castShadow = true
      sunLight.shadow.mapSize.set(2048, 2048)
      sunLight.shadow.camera.near = 1
      sunLight.shadow.camera.far = 500
      sunLight.shadow.camera.left = -100
      sunLight.shadow.camera.right = 100
      sunLight.shadow.camera.top = 100
      sunLight.shadow.camera.bottom = -20
      scene.add(sunLight)
      scene.add(new THREE.AmbientLight(0x8ab4d8, 1.0))
      scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3a6a28, 0.7))

      // ════════════════════════════════════════════════════════════════
      // SCENE DEPTH LAYOUT (matching reference photo):
      //
      // Camera at z=0, y=1.6 (standing in meadow)
      // 
      // z=0 to z=-80:     Flat meadow with wildflowers (3-80m)
      // z=-80 to z=-300:  Rolling green hills with scattered trees (80-300m)
      // z=-300 to z=-600: Forested hills, denser trees (300m-600m)
      // z=-800 to z=-2000: Mountain base to peak (800m-2km scale)
      //
      // Mountain peak: y=500 at z=-1200 (represents ~5km distant, ~4500m tall)
      // ════════════════════════════════════════════════════════════════

      // ── 1. FLAT MEADOW GROUND ──
      const meadowGeo = new THREE.PlaneGeometry(500, 300, 100, 60)
      meadowGeo.rotateX(-Math.PI / 2)
      // Gentle undulation
      const mPositions = meadowGeo.attributes.position.array as Float32Array
      for (let i = 0; i < mPositions.length / 3; i++) {
        const x = mPositions[i * 3], z = mPositions[i * 3 + 2]
        const gentle = Math.sin(x * 0.02) * Math.cos(z * 0.015) * 1.2
        mPositions[i * 3 + 1] = gentle
      }
      meadowGeo.computeVertexNormals()
      const meadowMat = new THREE.ShaderMaterial({
        vertexShader: groundVert, fragmentShader: groundFrag,
        uniforms: { uCamPos: { value: camera.position } },
      })
      const meadow = new THREE.Mesh(meadowGeo, meadowMat)
      meadow.position.set(0, -0.3, -100)
      meadow.receiveShadow = true
      scene.add(meadow)

      // ── 2. ROLLING HILLS (middle ground) ──
      // Shared function so trees can sample the exact same height
      const hillConfigs = [
        { z: -60, base: 8, amp: 12, freq: 0.006, green: 0.28 },
        { z: -140, base: 18, amp: 18, freq: 0.005, green: 0.22 },
        { z: -240, base: 30, amp: 22, freq: 0.004, green: 0.17 },
      ]
      function getHillY(layer: number, worldX: number, localZ: number): number {
        const c = hillConfigs[layer]
        return c.base + Math.sin(worldX * c.freq + layer * 1.7) * c.amp + Math.sin(worldX * 0.03 + localZ * 0.02) * 2.5
      }

      hillConfigs.forEach((c, layer) => {
        const hillGeo = new THREE.PlaneGeometry(800, 140, 120, 20)
        hillGeo.rotateX(-Math.PI / 2)
        const hPos = hillGeo.attributes.position.array as Float32Array
        for (let i = 0; i < hPos.length / 3; i++) {
          const x = hPos[i * 3], z = hPos[i * 3 + 2]
          hPos[i * 3 + 1] = getHillY(layer, x, z)
        }
        hillGeo.computeVertexNormals()
        const hillMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(c.green * 0.55, c.green * 1.6, c.green * 0.4),
          roughness: 0.9,
        })
        const hill = new THREE.Mesh(hillGeo, hillMat)
        hill.position.set(0, 0, c.z)
        hill.receiveShadow = true
        scene.add(hill)
      })

      // ── 3. PINE TREES on hills (scattered, getting smaller with distance) ──
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 5)
      const canopyGeo = new THREE.ConeGeometry(3, 8, 6)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 })

      for (let i = 0; i < 120; i++) {
        const layerIdx = Math.floor(seeded(i * 31) * 3)
        const c = hillConfigs[layerIdx]
        const tx = (seeded(i * 7) - 0.5) * 400
        const localZ = (seeded(i * 13) - 0.5) * 80
        const tz = c.z + localZ

        // Tree scale varies with distance
        const scale = 0.8 + layerIdx * 0.4
        // Use the SAME height function as the hill mesh
        const hillY = getHillY(layerIdx, tx, localZ)

        const treeGroup = new THREE.Group()
        const trunk = new THREE.Mesh(trunkGeo, trunkMat)
        trunk.position.y = 2 * scale
        trunk.scale.set(scale, scale, scale)
        treeGroup.add(trunk)

        const darkness = 0.12 + seeded(i * 17) * 0.08
        const canopyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(darkness, darkness * 2.5 + 0.1, darkness * 0.6),
          roughness: 0.95,
        })
        const canopy = new THREE.Mesh(canopyGeo, canopyMat)
        canopy.position.y = 7 * scale
        canopy.scale.set(scale, scale, scale)
        treeGroup.add(canopy)

        treeGroup.position.set(tx, hillY, tz)
        treeGroup.castShadow = true
        scene.add(treeGroup)
      }

      // ── 4. THE MOUNTAIN (far background, ~800-2000m away) ──
      // Create a sharp, majestic peak centered in the view
      const mtRes = 180
      const mtGeo = new THREE.PlaneGeometry(2000, 1400, mtRes - 1, mtRes - 1)
      mtGeo.rotateX(-Math.PI / 2)
      const mtPos = mtGeo.attributes.position.array as Float32Array
      const peakHeight = 220 // Sized so peak appears in upper quarter of frame

      // Procedural noise for mountain detail
      function mNoise(x: number, z: number, oct = 6): number {
        let v = 0, a = 1, f = 1, max = 0
        for (let i = 0; i < oct; i++) {
          v += (Math.sin(x * f * 0.7 + 1.3) * Math.cos(z * f * 0.5 + 2.1) * 0.5 + 0.5) * a
          max += a; a *= 0.52; f *= 2.05
        }
        return v / max
      }

      for (let i = 0; i < mtPos.length / 3; i++) {
        const x = mtPos[i * 3], z = mtPos[i * 3 + 2]
        // Central peak: sharp pyramid shape
        const dx = x / 400, dz = z / 500
        const peakDist = Math.sqrt(dx * dx + dz * dz)
        // Sharp conical peak shape with ridges
        const baseShape = Math.max(0, 1.0 - peakDist * 0.85)
        const sharpness = Math.pow(baseShape, 1.4) // Sharper peak
        // Add ridges radiating from peak
        const angle = Math.atan2(z, x)
        const ridge = (Math.sin(angle * 4) * 0.5 + 0.5) * 0.15 * baseShape
        // Rocky detail
        const detail = mNoise(x * 0.008, z * 0.008, 6) * 0.12 * baseShape
        const subDetail = mNoise(x * 0.025, z * 0.025, 4) * 0.05 * baseShape
        const h = (sharpness + ridge + detail + subDetail) * peakHeight
        mtPos[i * 3 + 1] = h
      }
      mtGeo.computeVertexNormals()

      const mtMat = new THREE.ShaderMaterial({
        vertexShader: mtVert, fragmentShader: mtFrag,
        uniforms: {
          uSunDir: { value: sunDir },
          uSnowLine: { value: 0.55 }, // Snow starts at 55% of peak height
          uPeakHeight: { value: peakHeight },
          uCamPos: { value: camera.position },
        },
      })
      const mountain = new THREE.Mesh(mtGeo, mtMat)
      mountain.position.set(0, -15, -1200) // Far behind the hills (front edge at z=-500)
      mountain.castShadow = true
      mountain.receiveShadow = true
      scene.add(mountain)

      // ── 5. VOLUMETRIC CLOUDS (high up, behind mountain) ──
      const cGeo = new THREE.PlaneGeometry(4000, 4000)
      cGeo.rotateX(-Math.PI / 2)
      cGeo.translate(0, 750, -600)
      const cMat = new THREE.ShaderMaterial({
        vertexShader: cloudVert, fragmentShader: cloudFrag,
        uniforms: {
          uTime: { value: 0 },
          uSunDir: { value: sunDir },
          uCamPos: { value: camera.position },
        },
        transparent: true, depthWrite: false, side: 2,
      })
      scene.add(new THREE.Mesh(cGeo, cMat))

      // ── 6. WILDFLOWER MEADOW (dense, close to camera) ──
      const flowerColors = [0x6B9FD4, 0x8B7FD4, 0xF0F0F0, 0xF0D060, 0xFF90B0]
      const stemGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.6, 4)
      const petalGeo = new THREE.SphereGeometry(0.1, 5, 4)
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a7a28, roughness: 0.9 })

      // 600 flowers densely packed in the foreground
      for (let i = 0; i < 600; i++) {
        const fx = (seeded(i * 7) - 0.5) * 120
        // Flowers from very close (z=5) to medium distance (z=-60)
        const fz = 5 - seeded(i * 11) * 65
        const fy = Math.sin(fx * 0.02) * Math.cos(fz * 0.015) * 1.2 - 0.3
        // Closer flowers are bigger
        const closeness = 1.0 - Math.abs(fz) / 70
        const scale = 0.6 + closeness * 0.8

        const stem = new THREE.Mesh(stemGeo, stemMat)
        stem.position.set(fx, fy + 0.3 * scale, fz)
        stem.scale.set(scale, scale, scale)
        scene.add(stem)

        const colorIdx = Math.floor(seeded(i * 13) * flowerColors.length)
        const pMat = new THREE.MeshStandardMaterial({
          color: flowerColors[colorIdx], roughness: 0.7,
        })
        const petal = new THREE.Mesh(petalGeo, pMat)
        petal.position.set(fx, fy + 0.65 * scale, fz)
        petal.scale.set(scale, scale * 0.5, scale)
        scene.add(petal)
      }

      // ── 7. KNOWLEDGE FLOWERS (special, in the meadow) ──
      const CATEGORY_COLORS: Record<string, number> = {
        '计算机科学': 0x00E5FF, '算法': 0xBB80FF, '数学': 0xFFD700,
      }
      const petalGeoK = new THREE.SphereGeometry(0.35, 8, 6)
      const centerGeoK = new THREE.SphereGeometry(0.15, 8, 8)
      const stemGeoK = new THREE.CylinderGeometry(0.03, 0.04, 1.5, 6)

      type KFlower = {
        entry: KnowledgeEntry; mesh: THREE.Group; basePos: THREE.Vector3; color: number
      }
      const kFlowers: KFlower[] = []

      entries.forEach((entry, i) => {
        const seed = entry.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        // Spread across meadow foreground, left to right
        const t = 0.1 + (i / Math.max(entries.length - 1, 1)) * 0.8
        const fx = (t - 0.5) * 60 + (seeded(seed) - 0.5) * 10
        const fz = -5 - seeded(seed + 1) * 30 // In front of camera
        const fy = Math.sin(fx * 0.02) * Math.cos(fz * 0.015) * 1.2 - 0.3

        const color = CATEGORY_COLORS[entry.category] ?? 0xFFB7C5
        const group = new THREE.Group()

        // Stem
        const sm = new THREE.Mesh(stemGeoK, new THREE.MeshStandardMaterial({ color: 0x2a6a1a }))
        sm.position.y = 0.75; group.add(sm)

        // Petals
        for (let p = 0; p < 7; p++) {
          const a = (p / 7) * Math.PI * 2
          const pm = new THREE.Mesh(petalGeoK, new THREE.MeshStandardMaterial({
            color, roughness: 0.5, emissive: color, emissiveIntensity: 0.2,
          }))
          pm.position.set(Math.cos(a) * 0.4, 1.7, Math.sin(a) * 0.4)
          pm.scale.set(1, 0.4, 0.8)
          group.add(pm)
        }

        // Center
        const cm = new THREE.Mesh(centerGeoK, new THREE.MeshStandardMaterial({
          color: 0xFFF9E0, emissive: 0xFFFFAA, emissiveIntensity: 0.3,
        }))
        cm.position.y = 1.7; group.add(cm)

        group.position.set(fx, fy, fz)
        scene.add(group)
        kFlowers.push({ entry, mesh: group, basePos: new THREE.Vector3(fx, fy, fz), color })
      })

      // ── Raycasting ──
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2(-99, -99)
      let hoveredIdx = -1

      const onMM = (e: MouseEvent) => {
        const r = renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1
        mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1
      }
      const onCl = () => { if (hoveredIdx >= 0) onEntryClick(kFlowers[hoveredIdx].entry.id) }
      renderer.domElement.addEventListener('mousemove', onMM)
      renderer.domElement.addEventListener('click', onCl)

      // ── Animation loop ──
      const clock = new THREE.Clock()
      function animate() {
        if (destroyed) return
        requestAnimationFrame(animate)
        const t = clock.getElapsedTime()

        cMat.uniforms.uTime.value = t

        // OrbitControls update (replaces auto camera sway)
        controls.update()

        // Raycast knowledge flowers
        raycaster.setFromCamera(mouse, camera)
        const allMesh = kFlowers.map(f => f.mesh.children).flat() as THREE.Mesh[]
        const hits = raycaster.intersectObjects(allMesh, false)
        let newH = -1
        if (hits.length > 0) {
          const idx = kFlowers.findIndex(f => f.mesh.children.includes(hits[0].object))
          if (idx >= 0) newH = idx
        }

        kFlowers.forEach((f, i) => {
          const isH = i === newH
          const isF = searchFilter.length > 0 &&
            !f.entry.title.includes(searchFilter) &&
            !(f.entry.titleEn ?? '').toLowerCase().includes(searchFilter.toLowerCase())
          const ts = isH ? 1.8 : 1.0
          f.mesh.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.1)
          f.mesh.rotation.z = Math.sin(t * 0.7 + f.basePos.x * 0.2) * 0.04
          f.mesh.children.forEach(c => {
            if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
              if (c.material.emissive && c.material.emissive.getHex() !== 0xFFFFAA) {
                c.material.emissiveIntensity = isH ? 0.4 + Math.sin(t * 4) * 0.15 : 0.2
              }
              c.material.opacity = isF ? 0.15 : 1.0
              c.material.transparent = isF
            }
          })
        })

        hoveredIdx = newH
        renderer.domElement.style.cursor = newH >= 0 ? 'pointer' : 'default'
        renderer.render(scene, camera)
      }
      animate()

      // Resize
      const onRs = () => {
        const nw = container.clientWidth, nh = container.clientHeight
        camera.aspect = nw / nh; camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onRs)

      cleanupRef.current = () => {
        destroyed = true
        controls.dispose()
        renderer.domElement.removeEventListener('mousemove', onMM)
        renderer.domElement.removeEventListener('click', onCl)
        window.removeEventListener('resize', onRs)
        renderer.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      }
    }

    init().catch(console.error)
    return () => { cleanupRef.current?.() }
  }, [entries, onEntryClick, searchFilter, lang])

  return (
    <div ref={containerRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
    />
  )
}
