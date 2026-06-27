import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const stage = document.querySelector(".egg-drop-stage");

if (stage) {
  const eggModes = (stage.dataset.eggMode || "default").split(/\s+/);
  const isSingleRightMode = eggModes.includes("single-right");
  const hasGlowMode = eggModes.includes("glow");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const eggs = [];
  const books = [];
  const pops = [];
  const maxEggs = isSingleRightMode ? 1 : 5;
  const counter = stage.querySelector(".egg-counter");
  const milestone = stage.querySelector(".egg-milestone");
  const milestonePhrases = [
    "New high score!",
    "Wait, five more?",
    "Okay, egg legend.",
    "This is getting serious.",
    "Shell dynasty unlocked!",
    "How are there still eggs?"
  ];
  let hatchedEggs = 0;
  let milestoneTimerId;
  let spawnTimerId;
  const floorY = -1.55;
  const gravity = -2.6;
  const shakeDelay = 3.8;

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.append(renderer.domElement);

  camera.position.set(0, 0, 6.2);
  scene.add(camera);

  scene.add(new THREE.AmbientLight(0xffffff, 2.1));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(2.4, 4.2, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xd9edf0, 1.2);
  rimLight.position.set(-3, 1.5, 2.4);
  scene.add(rimLight);

  const eggGeometry = new THREE.SphereGeometry(0.36, 48, 48);
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0xf1f1ed,
    opacity: 0.34,
    transparent: true,
    depthWrite: false
  });
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x292929,
    side: THREE.BackSide
  });
  const freckleMaterial = new THREE.MeshBasicMaterial({
    color: 0x3d3d3a
  });
  const popMaterial = new THREE.MeshBasicMaterial({
    color: 0x292929,
    opacity: 0.78,
    transparent: true,
    side: THREE.DoubleSide
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x1f1f1f,
    opacity: 0.18,
    transparent: true,
    depthWrite: false
  });
  const bookPageMaterial = new THREE.MeshBasicMaterial({
    color: 0xf7f7f4,
    opacity: 0.9,
    transparent: true,
    side: THREE.DoubleSide
  });
  const bookOutlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x292929,
    opacity: 1,
    transparent: true,
    side: THREE.DoubleSide
  });

  renderer.domElement.style.pointerEvents = "auto";

  const pointOnEgg = (radius) => {
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = THREE.MathUtils.randFloat(0.32, Math.PI - 0.24);
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * radius * 0.82,
      Math.cos(phi) * radius * 1.18,
      Math.sin(phi) * Math.sin(theta) * radius * 0.82
    );
  };

  const createEgg = () => {
    if (eggs.length >= maxEggs) {
      return;
    }

    const egg = new THREE.Group();
    const makeGlowShell = () => new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf4f1e8,
        opacity: 0,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    const glowOuter = makeGlowShell();
    const glowMiddle = makeGlowShell();
    const glowHalo = makeGlowShell();
    const glow = makeGlowShell();
    const shell = new THREE.Mesh(eggGeometry, shellMaterial.clone());
    const outline = new THREE.Mesh(eggGeometry, outlineMaterial.clone());
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 36), shadowMaterial.clone());
    const size = isSingleRightMode ? 0.76 : THREE.MathUtils.randFloat(0.3, 0.72);
    const freckleCount = THREE.MathUtils.randInt(18, 32);
    const eggHeightRadius = 0.36 * 1.18 * size;

    glowOuter.scale.set(size * 0.78, size * 0.92, size * 0.78);
    glowOuter.position.y = -0.015 * size;
    glowMiddle.scale.set(size * 0.6, size * 0.72, size * 0.6);
    glowMiddle.position.y = -0.015 * size;
    glowHalo.scale.set(size * 0.48, size * 0.58, size * 0.48);
    glowHalo.position.y = -0.015 * size;
    glow.scale.set(size * 0.26, size * 0.32, size * 0.26);
    glow.position.y = -0.015 * size;
    shell.scale.set(size * 0.82, size * 1.18, size * 0.82);
    outline.scale.set(size * 0.9, size * 1.26, size * 0.9);
    egg.add(glowOuter, glowMiddle, glowHalo, glow, outline, shell);

    for (let index = 0; index < freckleCount; index += 1) {
      const freckleSize = THREE.MathUtils.randFloat(0.008, 0.02) * size;
      const freckle = new THREE.Mesh(
        new THREE.SphereGeometry(freckleSize, 10, 10),
        freckleMaterial.clone()
      );
      const position = pointOnEgg(0.365 * size);
      freckle.position.copy(position);
      egg.add(freckle);
    }

    egg.position.set(
      isSingleRightMode ? 1.18 : THREE.MathUtils.randFloat(-1.28, 1.02),
      2.4,
      THREE.MathUtils.randFloat(-0.25, 0.2)
    );
    egg.rotation.set(
      THREE.MathUtils.randFloat(-0.18, 0.18),
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(-0.2, 0.2)
    );

    egg.userData = {
      age: 0,
      bounceCount: 0,
      bounceLimit: THREE.MathUtils.randInt(3, 5),
      bounceRestitution: THREE.MathUtils.randFloat(0.36, 0.52),
      canHatch: false,
      floorCenterY: floorY + eggHeightRadius,
      glow,
      glowHalo,
      glowMiddle,
      glowOuter,
      isEgg: true,
      isSettled: false,
      lateralDamping: THREE.MathUtils.randFloat(0.68, 0.82),
      landingTilt: THREE.MathUtils.randFloat(-0.18, 0.18),
      nextShakeIn: THREE.MathUtils.randFloat(0.2, 0.9),
      settledAge: 0,
      shakeBurstLeft: 0,
      shakeIntensity: 1,
      shakePhase: THREE.MathUtils.randFloat(0, Math.PI * 2),
      shadow,
      shadowBaseSize: size,
      size,
      spin: THREE.MathUtils.randFloat(-1.35, 1.35),
      velocityX: THREE.MathUtils.randFloat(-0.08, 0.08),
      velocityY: THREE.MathUtils.randFloat(-0.34, -0.08),
      wobble: THREE.MathUtils.randFloat(1.7, 2.6)
    };

    eggs.push(egg);
    scene.add(egg);
    scene.add(shadow);
  };

  const setGroupOpacity = (group, opacity) => {
    group.traverse((object) => {
      if (!object.material) {
        return;
      }

      object.material.opacity = opacity;
      object.material.transparent = opacity < 1 || object.material.transparent;
    });
  };

  const makeBookPanel = (x, rotationZ) => {
    const panel = new THREE.Group();
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), bookPageMaterial.clone());
    const outline = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.33), bookOutlineMaterial.clone());

    outline.position.z = -0.002;
    page.position.z = 0.002;
    panel.add(outline, page);
    panel.position.x = x;
    panel.rotation.z = rotationZ;

    return panel;
  };

  const createBook = (position, eggSize = 1) => {
    const book = new THREE.Group();
    const leftPage = makeBookPanel(-0.105, 0.12);
    const rightPage = makeBookPanel(0.105, -0.12);
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.32, 0.018),
      bookOutlineMaterial.clone()
    );

    spine.position.z = 0.01;
    book.add(leftPage, rightPage, spine);

    for (let lineIndex = 0; lineIndex < 3; lineIndex += 1) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.11, 0.008),
        bookOutlineMaterial.clone()
      );
      line.position.set(-0.105, 0.075 - lineIndex * 0.055, 0.02);
      line.rotation.z = 0.12;
      book.add(line);
    }

    for (let lineIndex = 0; lineIndex < 3; lineIndex += 1) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.11, 0.008),
        bookOutlineMaterial.clone()
      );
      line.position.set(0.105, 0.075 - lineIndex * 0.055, 0.02);
      line.rotation.z = -0.12;
      book.add(line);
    }

    book.position.copy(position);
    book.position.y += 0.18 + eggSize * 0.08;
    book.rotation.set(-0.16, 0, THREE.MathUtils.randFloat(-0.18, 0.18));
    book.scale.setScalar(THREE.MathUtils.clamp(eggSize * 1.65, 0.5, 1.35));
    book.userData = {
      age: 0,
      velocityY: 0.92
    };

    books.push(book);
    scene.add(book);
  };

  const createClickPop = (position) => {
    const pop = new THREE.Group();

    for (let index = 0; index < 6; index += 1) {
      const ray = new THREE.Mesh(
        new THREE.PlaneGeometry(0.009, THREE.MathUtils.randFloat(0.045, 0.075)),
        popMaterial.clone()
      );
      const angle = (index / 6) * Math.PI * 2 + THREE.MathUtils.randFloat(-0.16, 0.16);
      const distance = THREE.MathUtils.randFloat(0.09, 0.15);
      ray.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance, 0);
      ray.rotation.z = angle;
      ray.userData = {
        angle,
        startDistance: distance,
        travel: THREE.MathUtils.randFloat(0.035, 0.07)
      };
      pop.add(ray);
    }

    pop.position.copy(position);
    pop.position.z += 0.24;
    pop.rotation.set(0, 0, THREE.MathUtils.randFloat(0, Math.PI));
    pop.userData = {
      age: 0,
      duration: 0.34
    };

    pops.push(pop);
    scene.add(pop);
  };

  const scheduleEgg = () => {
    if (isSingleRightMode || spawnTimerId) {
      return;
    }

    spawnTimerId = window.setTimeout(() => {
      spawnTimerId = undefined;
      createEgg();
      scheduleEgg();
    }, THREE.MathUtils.randInt(5000, 18000));
  };

  const removeEgg = (egg, index) => {
    const shadow = egg.userData.shadow;

    if (shadow) {
      scene.remove(shadow);
      shadow.geometry?.dispose();
      shadow.material?.dispose();
    }

    scene.remove(egg);
    egg.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
    eggs.splice(index, 1);
  };

  const removeBook = (book, index) => {
    scene.remove(book);
    book.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
    });
    books.splice(index, 1);
  };

  const hatchEgg = (egg, popPosition = egg.position) => {
    if (!egg.userData.canHatch) {
      return;
    }

    createClickPop(popPosition);
    createBook(egg.position.clone(), egg.userData.size);
    removeEgg(egg, eggs.indexOf(egg));
    hatchedEggs += 1;

    if (counter) {
      counter.textContent = `Hatched Eggs: ${hatchedEggs}`;
    }

    if (milestone && hatchedEggs % 5 === 0) {
      const milestoneIndex = Math.min((hatchedEggs / 5) - 1, milestonePhrases.length - 1);
      milestone.textContent = milestonePhrases[milestoneIndex];
      milestone.classList.add("is-visible");
      window.clearTimeout(milestoneTimerId);
      milestoneTimerId = window.setTimeout(() => {
        milestone.classList.remove("is-visible");
      }, 2400);
    }

    scheduleEgg();
  };

  const findEggGroup = (object) => {
    let current = object;

    while (current) {
      if (current.userData?.isEgg) {
        return current;
      }
      current = current.parent;
    }

    return null;
  };

  const handlePointerDown = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(eggs, true);
    const egg = intersects.length > 0 ? findEggGroup(intersects[0].object) : null;

    if (egg?.userData.canHatch) {
      hatchEgg(egg, intersects[0].point);
    }
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const animate = () => {
    const delta = clock.getDelta();

    for (let index = eggs.length - 1; index >= 0; index -= 1) {
      const egg = eggs[index];
      egg.userData.age += delta;
      const heightAboveFloor = Math.max(0, egg.position.y - egg.userData.floorCenterY);
      const shadowStrength = THREE.MathUtils.clamp(1 - (heightAboveFloor / 2.2), 0.12, 1);
      const shadow = egg.userData.shadow;

      if (shadow) {
        shadow.position.set(egg.position.x, floorY + 0.018, egg.position.z - 0.08);
        shadow.material.opacity = 0.07 + shadowStrength * 0.16;
        shadow.scale.x = egg.userData.shadowBaseSize * (0.62 + shadowStrength * 0.52);
        shadow.scale.y = egg.userData.shadowBaseSize * (0.16 + shadowStrength * 0.1);
      }

      if (!egg.userData.isSettled) {
        egg.userData.velocityY += gravity * delta;
        egg.position.y += egg.userData.velocityY * delta;
        egg.position.x += egg.userData.velocityX * delta;
        egg.position.x += Math.sin(egg.userData.age * egg.userData.wobble) * delta * 0.05;
        egg.rotation.x += delta * 0.78;
        egg.rotation.y += delta * egg.userData.spin;

        if (egg.position.y <= egg.userData.floorCenterY) {
          egg.position.y = egg.userData.floorCenterY;
          egg.userData.bounceCount += 1;
          egg.userData.velocityX *= egg.userData.lateralDamping;
          egg.userData.spin *= 0.72;

          if (egg.userData.bounceCount >= egg.userData.bounceLimit) {
            egg.userData.isSettled = true;
            egg.userData.velocityY = 0;
            egg.userData.velocityX *= 0.12;
            egg.userData.spin = 0;
            egg.rotation.z += egg.userData.landingTilt;
          } else {
            const remainingBounceRatio = 1 - (egg.userData.bounceCount / egg.userData.bounceLimit);
            const hopWeight = THREE.MathUtils.randFloat(0.78, 1.2);
            egg.userData.velocityY = Math.max(
              0.32,
              Math.abs(egg.userData.velocityY) * egg.userData.bounceRestitution * remainingBounceRatio * hopWeight
            );
          }
        }
      } else {
        egg.userData.settledAge += delta;

        if (egg.userData.settledAge >= shakeDelay) {
          egg.userData.canHatch = true;
          egg.userData.nextShakeIn -= delta;

          if (egg.userData.shakeBurstLeft <= 0 && egg.userData.nextShakeIn <= 0) {
            egg.userData.shakeBurstLeft = THREE.MathUtils.randFloat(0.18, 0.52);
            egg.userData.shakeIntensity = THREE.MathUtils.randFloat(0.75, 1.45);
            egg.userData.nextShakeIn = THREE.MathUtils.randFloat(0.35, 1.35);
          }

          if (egg.userData.shakeBurstLeft > 0) {
            egg.userData.shakeBurstLeft -= delta;
            const jolt = egg.userData.shakeIntensity;
            egg.rotation.z += Math.sin((egg.userData.settledAge * 18) + egg.userData.shakePhase) * delta * 1.15 * jolt;
            egg.rotation.y += Math.sin((egg.userData.settledAge * 15) + egg.userData.shakePhase) * delta * 0.32 * jolt;
            egg.position.x += Math.sin((egg.userData.settledAge * 22) + egg.userData.shakePhase) * delta * 0.12 * jolt;
          } else {
            egg.rotation.z += Math.sin((egg.userData.settledAge * 3) + egg.userData.shakePhase) * delta * 0.025;
          }

          if (hasGlowMode && egg.userData.glow) {
            const glowPulse = 0.1 + Math.abs(Math.sin(egg.userData.settledAge * 5)) * 0.16;
            egg.userData.glow.material.opacity = glowPulse * 0.58;
            egg.userData.glowHalo.material.opacity = glowPulse * 0.5;
            egg.userData.glowMiddle.material.opacity = glowPulse * 0.62;
            egg.userData.glowOuter.material.opacity = glowPulse * 0.38;
          }
        } else {
          const settle = Math.max(0, 1 - egg.userData.settledAge / 1.8);
          egg.rotation.z += Math.sin((egg.userData.settledAge * 9) + egg.userData.shakePhase) * delta * 0.05 * settle;

          if (egg.userData.glow) {
            egg.userData.glow.material.opacity = 0;
            egg.userData.glowHalo.material.opacity = 0;
            egg.userData.glowMiddle.material.opacity = 0;
            egg.userData.glowOuter.material.opacity = 0;
          }
        }
      }
    }

    for (let index = books.length - 1; index >= 0; index -= 1) {
      const book = books[index];
      book.userData.age += delta;
      book.userData.velocityY -= 1.45 * delta;
      book.position.y += book.userData.velocityY * delta;
      book.rotation.z += delta * 0.32;

      const fade = THREE.MathUtils.clamp((1.9 - book.userData.age) / 0.62, 0, 1);
      setGroupOpacity(book, fade);

      if (fade <= 0) {
        removeBook(book, index);
      }
    }

    for (let index = pops.length - 1; index >= 0; index -= 1) {
      const pop = pops[index];
      pop.userData.age += delta;

      const progress = Math.min(1, pop.userData.age / pop.userData.duration);
      const opacity = 1 - progress;

      pop.traverse((object) => {
        if (object.material) {
          object.material.opacity = opacity * 0.42;
        }

        if (object.userData?.angle !== undefined) {
          const distance = object.userData.startDistance + object.userData.travel * progress;
          object.position.x = Math.cos(object.userData.angle) * distance;
          object.position.y = Math.sin(object.userData.angle) * distance;
        }
      });

      if (progress >= 1) {
        scene.remove(pop);
        pop.traverse((object) => {
          object.geometry?.dispose();
          object.material?.dispose();
        });
        pops.splice(index, 1);
      }
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  };

  resize();
  createEgg();
  scheduleEgg();
  animate();
  window.addEventListener("resize", resize);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
}
