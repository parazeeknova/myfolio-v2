import * as THREE from "three";
import vertexShader from "./shaders/floating-logos.vert";
import fragmentShader from "./shaders/floating-logos.frag";

export function createLogoScene(logoElement, index, onSceneReady) {
  if (!logoElement) return null;

  const img = logoElement.querySelector("img");
  if (!img) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 10);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  const rect = logoElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);

  img.style.display = "none";
  logoElement.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(img.src, (texture) => {
    const geometry = new THREE.PlaneGeometry(2.2, 2.2, 32, 32);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uPeelProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const sceneData = { scene, camera, renderer, material, mesh, index };
    if (onSceneReady) {
      onSceneReady(sceneData);
    }
  });

  return { scene, camera, renderer };
}

export function startAnimationLoop(
  scene,
  camera,
  renderer,
  material,
  isDestroyed
) {
  const renderLoop = () => {
    if (!isDestroyed()) {
      material.uniforms.uTime.value += 0.016;
      renderer.render(scene, camera);
      requestAnimationFrame(renderLoop);
    }
  };
  renderLoop();
}

export function disposeScene(sceneData) {
  const { scene, renderer, material, mesh } = sceneData;

  scene.remove(mesh);
  mesh.geometry.dispose();
  material.dispose();

  if (material.uniforms.uTexture.value) {
    material.uniforms.uTexture.value.dispose();
  }

  renderer.dispose();
}
