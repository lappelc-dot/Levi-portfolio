const evidenceSpotlight = document.querySelector("[data-evidence-spotlight]");
const spotlightCards = document.querySelectorAll("[data-spotlight-card]");
const spotlightReturn = document.querySelector("[data-spotlight-return]");

if (evidenceSpotlight && spotlightCards.length > 0 && spotlightReturn) {
  const introFragment = document.createDocumentFragment();
  const introNodes = Array.from(evidenceSpotlight.childNodes);
  let currentMode = "intro";
  let spotlightTimerId;

  const clearSpotlightTimer = () => {
    window.clearInterval(spotlightTimerId);
    spotlightTimerId = undefined;
  };

  const setActiveCard = (activeCard) => {
    spotlightCards.forEach((card) => {
      card.classList.toggle("is-selected", card === activeCard);
    });
    spotlightReturn.classList.toggle("is-visible", Boolean(activeCard));
  };

  const cycleSpotlightImages = () => {
    const media = evidenceSpotlight.querySelector(".spotlight-media");
    const slides = Array.from(evidenceSpotlight.querySelectorAll(".spotlight-media img"));
    let currentIndex = 0;
    const calmDelay = 1800;

    if (slides.length <= 1) {
      return;
    }

    const previousButton = document.createElement("button");
    previousButton.className = "spotlight-arrow spotlight-arrow-prev";
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", "Previous image");

    const nextButton = document.createElement("button");
    nextButton.className = "spotlight-arrow spotlight-arrow-next";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next image");

    media?.append(previousButton, nextButton);

    const showSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === currentIndex);
      });
    };

    const advance = () => {
      showSlide(currentIndex + 1);
    };

    const startTimer = (delay) => {
      clearSpotlightTimer();
      spotlightTimerId = window.setInterval(advance, delay);
    };

    previousButton.addEventListener("click", (event) => {
      event.stopPropagation();
      showSlide(currentIndex - 1);
    });

    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      showSlide(currentIndex + 1);
    });

    media?.addEventListener("click", (event) => {
      event.stopPropagation();
      const mediaRect = media.getBoundingClientRect();
      const direction = event.clientX < mediaRect.left + (mediaRect.width / 2) ? -1 : 1;
      showSlide(currentIndex + direction);
    });

    media?.addEventListener("mouseenter", () => {
      media.classList.add("is-hovered");
      clearSpotlightTimer();
    });

    media?.addEventListener("mouseleave", () => {
      media.classList.remove("is-hovered");
      startTimer(calmDelay);
    });

    showSlide(0);
    startTimer(calmDelay);
  };

  const replaceSpotlight = (nodes, mode, activeCard = null) => {
    evidenceSpotlight.classList.add("is-swapping");

    window.setTimeout(() => {
      clearSpotlightTimer();

      if (currentMode === "intro") {
        introNodes.forEach((node) => introFragment.append(node));
      }

      evidenceSpotlight.replaceChildren(...nodes);
      currentMode = mode;
      evidenceSpotlight.dataset.spotlightMode = mode;
      evidenceSpotlight.classList.toggle("is-proof-spotlight", mode === "proof");
      setActiveCard(activeCard);

      if (mode === "proof") {
        cycleSpotlightImages();
      }

      window.requestAnimationFrame(() => {
        evidenceSpotlight.classList.remove("is-swapping");

        if (mode === "proof") {
          evidenceSpotlight.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    }, 160);
  };

  const buildProofSpotlight = (card) => {
    const media = document.createElement("div");
    media.className = "spotlight-media";

    card.querySelectorAll(".proof-media img").forEach((image, index) => {
      const clone = image.cloneNode();
      clone.classList.toggle("is-active", index === 0);
      media.append(clone);
    });

    const cardLabel = card.querySelector("span")?.textContent || "Evidence";
    const cardTitle = card.querySelector("h3")?.textContent || "Student Learning";
    const cardBody = card.querySelector("p")?.innerHTML || "";
    const copy = document.createElement("div");
    copy.className = "spotlight-copy";
    copy.innerHTML = `
      <p class="eyebrow">${cardLabel}</p>
      <h1>${cardTitle}</h1>
      <p>${cardBody}</p>
    `;

    return [media, copy];
  };

  const showIntro = () => {
    replaceSpotlight(introNodes, "intro");
  };

  const showProof = (card) => {
    replaceSpotlight(buildProofSpotlight(card), "proof", card);
  };

  const handleKeyboardClick = (event, action) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    action();
  };

  spotlightCards.forEach((card) => {
    card.addEventListener("click", () => showProof(card));
    card.addEventListener("keydown", (event) => {
      handleKeyboardClick(event, () => showProof(card));
    });
  });

  spotlightReturn.addEventListener("click", showIntro);
  spotlightReturn.addEventListener("keydown", (event) => {
    handleKeyboardClick(event, showIntro);
  });
}
