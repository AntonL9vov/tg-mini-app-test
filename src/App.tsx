// import './App.css'
// import Board from "./components/Board/Board.tsx";
// import {Canvas} from "@react-three/fiber";
// import Decoration from "./components/Decoration.tsx";
// import {OrbitControls} from "@react-three/drei";
//
// const App = () => {
//
//     return (
//         <>
//             <Canvas camera={{position: [0, 2, 5], fov: 75}} style={{height: '100vh'}}>
//                 <ambientLight intensity={0.5}/>
//                 <pointLight position={[10, 10, 10]}/>
//                 <Board/>
//
//                 <Decoration position={[1, 0.1, -1]}>🔮</Decoration>
//                 <Decoration position={[-1, 0.1, 1]}>📜</Decoration>
//
//                 <OrbitControls/>
//             </Canvas>
//         </>
//     )
// }
//
// export default App

import {Canvas, extend, useFrame, useLoader} from '@react-three/fiber';
import {OrbitControls, useTexture} from '@react-three/drei';
import {useEffect, useLayoutEffect, useRef} from "react";
import {ImprovedNoise} from "three/examples/jsm/math/ImprovedNoise";
import * as THREE from 'three';
import {glsl} from "three/src/nodes/code/CodeNode";


function MysticTable() {
    const woodTexture = useTexture('src/table.webp'); // Замените на путь к текстуре дерева

    return (
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[5, 0.3, 3]}/>
            {/* Объёмный стол */}
            <meshStandardMaterial map={woodTexture}/>
        </mesh>
    );
}

function Cloth() {
    const fabricTexture = useTexture('src/texture.jpg'); // Текстура ткани

    return (
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 2.5]}/>
            <meshStandardMaterial map={fabricTexture}/>
        </mesh>
    );
}

// function Flame({ position }) {
//     const flameRef = useRef();
//
//     useFrame(({ clock }) => {
//         if (flameRef.current) {
//             const time = clock.getElapsedTime();
//             const geometry = flameRef.current.geometry;
//
//             if (geometry && geometry.attributes && geometry.attributes.position) {
//                 const positions = geometry.attributes.position.array;
//                 const scale = 0.3;
//                 const maxDisplacement = 0.01; // Ограничиваем смещение
//
//                 for (let i = 0; i < positions.length; i += 3) {
//                     const x = positions[i];
//                     const y = positions[i + 1];
//                     const z = positions[i + 2];
//
//                     // Плавное колебание
//                     const displacement = Math.sin(time * scale + x * 2.0) * maxDisplacement;
//                     positions[i + 1] = y + displacement;
//                 }
//
//                 geometry.attributes.position.needsUpdate = true;
//             }
//         }
//     });
//
//     // Создание плоскости для пламени
//     const geometry = new THREE.PlaneGeometry(0.2, 0.6, 32, 32);
//
//     return (
//         <mesh position={position} ref={flameRef} castShadow>
//             <primitive object={geometry} />
//             <meshStandardMaterial color="#ff6f00" emissive="#ff4500" emissiveIntensity={1} />
//         </mesh>
//     );
// }

const fireMaterial = () => {
    return new THREE.ShaderMaterial({
        defines: {
            ITERATIONS: '10',
            OCTIVES: '3'
        },
        uniforms: {
            fireTex: { type: 't', value: null },
            color: { type: 'c', value: new THREE.Color(1, 1, 1) },
            time: { type: 'f', value: 0.0 },
            seed: { type: 'f', value: 0.0 },
            invModelMatrix: { type: 'm4', value: new THREE.Matrix4() },
            scale: { type: 'v3', value: new THREE.Vector3(1, 1, 1) },
            noiseScale: { type: 'v4', value: new THREE.Vector4(1, 2, 1, 0.3) },
            magnitude: { type: 'f', value: 2.5 },
            lacunarity: { type: 'f', value: 3.0 },
            gain: { type: 'f', value: 0.6 }
        },
        vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      }
    `,
        fragmentShader: glsl`
      #pragma glslify: snoise = require(glsl-noise/simplex/3d.glsl)

      uniform vec3 color;
      uniform float time;
      uniform float seed;
      uniform mat4 invModelMatrix;
      uniform vec3 scale;
      uniform vec4 noiseScale;
      uniform float magnitude;
      uniform float lacunarity;
      uniform float gain;
      uniform sampler2D fireTex;
      varying vec3 vWorldPos;

      float turbulence(vec3 p) {
        float sum = 0.0;
        float freq = 1.0;
        float amp = 1.0;
        for(int i = 0; i < OCTIVES; i++) {
          sum += abs(snoise(p * freq)) * amp;
          freq *= lacunarity;
          amp *= gain;
        }
        return sum;
      }

      vec4 samplerFire (vec3 p, vec4 scale) {
        vec2 st = vec2(sqrt(dot(p.xz, p.xz)), p.y);
        if(st.x <= 0.0 || st.x >= 1.0 || st.y <= 0.0 || st.y >= 1.0) return vec4(0.0);
        p.y -= (seed + time) * scale.w;
        p *= scale.xyz;
        st.y += sqrt(st.y) * magnitude * turbulence(p);
        if(st.y <= 0.0 || st.y >= 1.0) return vec4(0.0);
        return texture2D(fireTex, st);
      }

      vec3 localize(vec3 p) {
        return (invModelMatrix * vec4(p, 1.0)).xyz;
      }

      void main() {
        vec3 rayPos = vWorldPos;
        vec3 rayDir = normalize(rayPos - cameraPosition);
        float rayLen = 0.0288 * length(scale.xyz);
        vec4 col = vec4(0.0);
        for(int i = 0; i < ITERATIONS; i++) {
          rayPos += rayDir * rayLen;
          vec3 lp = localize(rayPos);
          lp.y += 0.5;
          lp.xz *= 2.0;
          col += samplerFire(lp, noiseScale);
        }
        col.a = col.r;
        gl_FragColor = col;
      }
    `
    });
};

function Fire({color, ...props}) {
    const ref = useRef()
    const texture = useLoader(THREE.TextureLoader, 'src/fire.png')
    useFrame((state) => {
        const invModelMatrix = ref.current.material.uniforms.invModelMatrix.value
        ref.current.updateMatrixWorld()
        invModelMatrix.copy(ref.current.matrixWorld).invert()
        ref.current.material.uniforms.time.value = state.clock.elapsedTime
        ref.current.material.uniforms.invModelMatrix.value = invModelMatrix
        ref.current.material.uniforms.scale.value = ref.current.scale
    })
    useLayoutEffect(() => {
        texture.magFilter = texture.minFilter = THREE.LinearFilter
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
        ref.current.material.uniforms.fireTex.value = texture
        ref.current.material.uniforms.color.value = color || new THREE.Color(0xeeeeee)
        ref.current.material.uniforms.invModelMatrix.value = new THREE.Matrix4()
        ref.current.material.uniforms.scale.value = new THREE.Vector3(1, 1, 1)
        ref.current.material.uniforms.seed.value = Math.random() * 19.19
    }, [])
    return (
        <mesh ref={ref} {...props}>
            <boxGeometry/>
            <fireMaterial transparent depthWrite={false} depthTest={false} />
        </mesh>
    )
}

function Candle({position}) {
    return (
        <group position={position}>
            {/* Тело свечи */}
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.1, 0.12, 0.4, 32]}/>
                <meshStandardMaterial color="#FFF5E1"/>
            </mesh>

            {/* Фитиль */}
            <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.1, 32]}/>
                <meshStandardMaterial color="black"/>
            </mesh>

            {/* Пламя свечи */}
            <Fire position={[0, 0.35, 0]}/>

            {/* Свет от пламени */}
            <pointLight position={[0, 0.35, 0]} intensity={1} distance={3} decay={2} color="#ff8c00"/>
        </group>
    );
}

function MysticScene() {
    return (
        <Canvas camera={{position: [0, 5, 5], fov: 50}} shadowMap>
            <ambientLight intensity={0.5}/>
            <pointLight position={[5, 5, 5]} intensity={1.5}/>
            <MysticTable/>
            <Cloth/>
            <Candle position={[-2.2, 0.3, -1.2]}/>
            <Candle position={[2.2, 0.3, -1.2]}/>
            <Candle position={[-2.2, 0.3, 1.2]}/>
            <Candle position={[2.2, 0.3, 1.2]}/>
            {/* Добавьте другие элементы по желанию */}
            <OrbitControls/>
        </Canvas>
    );
}

export default function App() {
    return (
        <div style={{height: '100vh', backgroundColor: '#111'}}>
            <MysticScene/>
        </div>
    );
}
