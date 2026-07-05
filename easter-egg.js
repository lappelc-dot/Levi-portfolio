const racerNodes = Array.from(document.querySelectorAll(".svg-egg-racer"));
const star = document.querySelector(".secret-star");

let cursor = null;
let animationFrame = 0;
let starCollected = false;

const racers = racerNodes.map((node) => ({
  node,
  body: node.querySelector(".kart-bounce"),
  lastHop: 0,
  boostTimer: 0,
}));

function getRacerRect(racer) {
  const rect = racer.node.getBoundingClientRect();

  if (rect.width || rect.height) {
    return rect;
  }

  return null;
}

function hopRacer(racer, now) {
  if (!racer.body || now - racer.lastHop < 4200) {
    return;
  }

  racer.lastHop = now;
  window.clearTimeout(racer.boostTimer);

  racer.node.classList.add("is-boosting");

  racer.body.classList.remove("is-hopping");
  void racer.body.getBoundingClientRect();
  racer.body.classList.add("is-hopping");

  window.setTimeout(() => {
    racer.body.classList.remove("is-hopping");
  }, 1480);

  racer.boostTimer = window.setTimeout(() => {
    racer.node.classList.remove("is-boosting");
  }, 1700);
}

function rectsOverlap(first, second) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

function collectStar(racer) {
  if (starCollected || !star) {
    return;
  }

  starCollected = true;
  const rect = getRacerRect(racer);

  star.classList.add("is-collected");
  racer.body?.classList.remove("is-hopping");
  racer.node.classList.add("is-collected-racer");

  if (rect) {
    launchFlyingKart(racer, rect);
  }
}

function launchFlyingKart(racer, rect) {
  const sourceKart = racer.node.querySelector(".retro-kart");
  const eggColor = sourceKart?.style.getPropertyValue("--racer-egg-color") || "#f4d565";
  const flyer = document.createElement("div");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  const use = document.createElementNS(svgNamespace, "use");

  flyer.className = "flying-star-kart";
  flyer.style.left = `${rect.left + rect.width / 2}px`;
  flyer.style.top = `${rect.top + rect.height / 2}px`;

  svg.setAttribute("viewBox", "0 0 104 68");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  use.setAttribute("href", "#egg-kart-symbol");
  use.classList.add("retro-kart");
  use.style.setProperty("--racer-egg-color", eggColor);

  svg.append(use);
  flyer.append(svg);
  document.body.append(flyer);
  flyKartToSky(flyer, rect);
}

function flyKartToSky(flyer, rect) {
  const startTime = performance.now();
  const duration = 7900;
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  const endX = window.innerWidth + 90;
  const endY = -90;
  const loopRadius = 150;
  const loopCenterX = startX + 230;
  const loopCenterY = startY - 176;
  const loopEntryX = loopCenterX;
  const loopEntryY = loopCenterY + loopRadius;
  const approachDistance = Math.hypot(loopEntryX - startX, loopEntryY - startY);
  const loopDistance = Math.PI * 2 * loopRadius;
  const exitDistance = Math.hypot(endX - loopEntryX, endY - loopEntryY);
  const totalDistance = approachDistance + loopDistance + exitDistance;
  const loopStart = approachDistance / totalDistance;
  const loopEnd = (approachDistance + loopDistance) / totalDistance;
  let previousRotation = 0;

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function launchAcceleration(progress) {
    return (0.34 * progress) + (0.66 * progress * progress);
  }

  function getFlightPosition(progress) {
    const traveled = totalDistance * launchAcceleration(progress);

    if (traveled < approachDistance) {
      const segmentProgress = traveled / approachDistance;
      return {
        x: lerp(startX, loopEntryX, segmentProgress),
        y: lerp(startY, loopEntryY, segmentProgress),
      };
    }

    if (traveled <= approachDistance + loopDistance) {
      const loopProgress = (traveled - approachDistance) / loopDistance;
      const angle = (Math.PI / 2) - (loopProgress * Math.PI * 2);

      return {
        x: loopCenterX + Math.cos(angle) * loopRadius,
        y: loopCenterY + Math.sin(angle) * loopRadius,
      };
    }

    const exitProgress = (traveled - approachDistance - loopDistance) / exitDistance;

    return {
      x: lerp(loopEntryX, endX, exitProgress),
      y: lerp(loopEntryY, endY, exitProgress),
    };
  }

  function getLaunchShake(progress) {
    if (progress >= 0.08) {
      return { x: 0, y: 0 };
    }

    const fade = 1 - (progress / 0.08);

    return {
      x: Math.sin(progress * 260) * fade * 0.35,
      y: Math.cos(progress * 280) * fade * 0.18,
    };
  }

  function animateFlight(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const distanceProgress = launchAcceleration(progress);
    const position = getFlightPosition(progress);
    const nextPosition = getFlightPosition(Math.min(progress + 0.0025, 1));
    const shake = getLaunchShake(progress);
    const nextShake = getLaunchShake(Math.min(progress + 0.0025, 1));
    const x = position.x + shake.x;
    const y = position.y + shake.y;
    const nextX = nextPosition.x + nextShake.x;
    const nextY = nextPosition.y + nextShake.y;
    const travelAngle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);
    const isLooping = distanceProgress >= loopStart && distanceProgress <= loopEnd;
    const targetRotation = Number.isFinite(travelAngle)
      ? isLooping
        ? travelAngle
        : Math.max(Math.min(travelAngle, 24), -52)
      : previousRotation;
    const angleDelta = ((targetRotation - previousRotation + 540) % 360) - 180;
    const rotation = isLooping ? targetRotation : previousRotation + angleDelta * 0.38;
    const scale = 1 - progress * 0.24;
    const opacity = progress > 0.82 ? 1 - (progress - 0.82) / 0.18 : 1;

    flyer.style.opacity = `${Math.max(opacity, 0)}`;
    flyer.style.transform = `translate(-50%, -50%) translate(${x - startX}px, ${y - startY}px) rotate(${rotation}deg) scale(${scale})`;
    previousRotation = rotation;

    if (progress < 1) {
      window.requestAnimationFrame(animateFlight);
      return;
    }

    flyer.remove();
  }

  window.requestAnimationFrame(animateFlight);
}

function watchStarCollision() {
  if (!starCollected && star) {
    const starRect = star.getBoundingClientRect();

    racers.some((racer) => {
      const rect = getRacerRect(racer);

      if (rect && rectsOverlap(rect, starRect)) {
        collectStar(racer);
        return true;
      }

      return false;
    });
  }

  window.requestAnimationFrame(watchStarCollision);
}

function watchCursor() {
  animationFrame = 0;

  if (!cursor) {
    return;
  }

  const now = performance.now();
  const cursorRadius = 10;

  racers.forEach((racer) => {
    const rect = getRacerRect(racer);

    if (!rect) {
      return;
    }

    const isInsideCursorZone =
      cursor.x >= rect.left - cursorRadius &&
      cursor.x <= rect.right + cursorRadius &&
      cursor.y >= rect.top - cursorRadius &&
      cursor.y <= rect.bottom + cursorRadius;

    if (isInsideCursorZone) {
      hopRacer(racer, now);
    }
  });
}

window.addEventListener("pointermove", (event) => {
  cursor = {
    x: event.clientX,
    y: event.clientY,
  };

  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(watchCursor);
  }
});

watchStarCollision();
