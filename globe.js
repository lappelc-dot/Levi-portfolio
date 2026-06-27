import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const container = document.querySelector("#location-globe");

if (container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  const textureLoader = new THREE.TextureLoader();
  const globeGroup = new THREE.Group();
  const globeRadius = 1.2;
  const fullRotationSeconds = 24;
  const savedStateKey = "levi-location-globe-rotation";
  const clock = new THREE.Clock();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.prepend(renderer.domElement);

  camera.position.set(0, 0.02, 4.7);
  scene.add(camera);
  scene.add(globeGroup);

  scene.add(new THREE.AmbientLight(0xf8fbff, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
  keyLight.position.set(2.8, 3.4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8bc5d9, 1.3);
  rimLight.position.set(-3.6, 0.5, 3);
  scene.add(rimLight);

  const loadTexture = (src, colorSpace = THREE.SRGBColorSpace) => {
    const texture = textureLoader.load(src);
    texture.colorSpace = colorSpace;
    texture.anisotropy = 8;
    return texture;
  };

  const earthTexture = loadTexture("resources/images/Earth Model/textures/earth albedo web.jpg");
  const bumpTexture = loadTexture(
    "resources/images/Earth Model/textures/earth bump web.jpg",
    THREE.NoColorSpace
  );
  const cloudTexture = loadTexture("resources/images/Earth Model/textures/clouds earth web.png");

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius, 96, 96),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.045,
      roughness: 0.86,
      metalness: 0.02
    })
  );

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * 1.014, 96, 96),
    new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      roughness: 1
    })
  );

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * 1.06, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x83cbe8,
      opacity: 0.14,
      transparent: true,
      side: THREE.BackSide
    })
  );

  globeGroup.add(earth, clouds, atmosphere);

  const latLongToVector3 = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  const koreaNormal = latLongToVector3(36.5, 127.8, 1).normalize();
  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd43f31,
    roughness: 0.32,
    metalness: 0.12
  });

  const pinStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.017, 0.42, 20),
    pinMaterial
  );
  pinStem.position.copy(koreaNormal.clone().multiplyScalar(globeRadius + 0.2));
  pinStem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), koreaNormal);

  const pinHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 30, 16),
    pinMaterial
  );
  pinHead.position.copy(koreaNormal.clone().multiplyScalar(globeRadius + 0.44));

  const pinBase = new THREE.Mesh(
    new THREE.RingGeometry(0.052, 0.088, 30),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.82,
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  pinBase.position.copy(koreaNormal.clone().multiplyScalar(globeRadius + 0.012));
  pinBase.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), koreaNormal);

  globeGroup.add(pinBase, pinStem, pinHead);

  const getSavedRotation = () => {
    try {
      return JSON.parse(window.sessionStorage.getItem(savedStateKey));
    } catch {
      return null;
    }
  };

  const saveRotation = () => {
    try {
      window.sessionStorage.setItem(savedStateKey, JSON.stringify({
        globeY: globeGroup.rotation.y,
        cloudsY: clouds.rotation.y
      }));
    } catch {
      // The globe can still spin normally if browser storage is unavailable.
    }
  };

  const savedRotation = getSavedRotation();
  globeGroup.rotation.x = -0.16;
  globeGroup.rotation.y = Number.isFinite(savedRotation?.globeY) ? savedRotation.globeY : -2.42;
  clouds.rotation.y = Number.isFinite(savedRotation?.cloudsY) ? savedRotation.cloudsY : 0;

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight || width);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const animate = () => {
    const delta = clock.getDelta();
    const rotationSpeed = (Math.PI * 2) / fullRotationSeconds;

    globeGroup.rotation.y += rotationSpeed * delta;
    clouds.rotation.y += rotationSpeed * 1.18 * delta;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  resize();
  animate();
  window.addEventListener("pagehide", saveRotation);
  window.addEventListener("beforeunload", saveRotation);
  window.addEventListener("resize", resize);
}
