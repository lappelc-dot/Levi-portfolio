const slideshows = document.querySelectorAll("[data-slideshow]");

const moduleGroups = document.querySelectorAll("[data-focus-modules]");

moduleGroups.forEach((group) => {
  const tabs = Array.from(group.querySelectorAll("[data-module-tab]"));
  const panels = Array.from(group.querySelectorAll("[data-module-panel]"));

  const setActiveModule = (moduleName) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.moduleTab === moduleName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.modulePanel === moduleName;
      panel.classList.toggle("is-active", isActive);
      panel.toggleAttribute("inert", !isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveModule(tab.dataset.moduleTab);
    });

    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (tabs.indexOf(tab) + direction + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      setActiveModule(tabs[nextIndex].dataset.moduleTab);
    });
  });
});

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
    const calmDelay = 6200;
    const hoverDelay = 1900;

    if (slides.length <= 1) {
      return;
    }

    const showSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === currentIndex);
      });
    };

    const advance = () => {
      currentIndex = (currentIndex + 1) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === currentIndex);
      });
    };

    const startTimer = (delay) => {
      clearSpotlightTimer();
      spotlightTimerId = window.setInterval(advance, delay);
    };

    media?.addEventListener("click", () => {
      advance();
      startTimer(media.matches(":hover") ? hoverDelay : calmDelay);
    });

    media?.addEventListener("mouseenter", () => {
      media.classList.add("is-hovered");
      startTimer(hoverDelay);
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

const proofSlideshows = document.querySelectorAll("[data-proof-slideshow]");

proofSlideshows.forEach((card) => {
  const slides = Array.from(card.querySelectorAll(".proof-media img"));
  let currentIndex = 0;
  let timerId;

  if (slides.length <= 1) {
    return;
  }

  const showSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentIndex);
    });
  };

  const start = () => {
    window.clearInterval(timerId);
    timerId = window.setInterval(() => {
      showSlide(currentIndex + 1);
    }, 1500);
  };

  const stop = () => {
    window.clearInterval(timerId);
    timerId = undefined;
    showSlide(0);
  };

  card.addEventListener("mouseenter", start);
  card.addEventListener("mouseleave", stop);
  card.addEventListener("focusin", start);
  card.addEventListener("focusout", stop);

  showSlide(0);
});

slideshows.forEach((slideshow) => {
  const slides = Array.from(slideshow.querySelectorAll("img"));
  const previousButton = slideshow.querySelector(".slideshow-control-prev");
  const nextButton = slideshow.querySelector(".slideshow-control-next");
  const dotsContainer = slideshow.querySelector(".slideshow-dots");
  let currentIndex = 0;

  if (slides.length === 0) {
    return;
  }

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dotsContainer?.append(dot);
    return dot;
  });

  const showSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });
  };

  const goToSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    showSlide(currentIndex);
  };

  showSlide(currentIndex);

  previousButton?.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
    });
  });
});

const adaptiveSlideshows = document.querySelectorAll("[data-adaptive-slideshow]");

adaptiveSlideshows.forEach((slideshow) => {
  const slides = Array.from(slideshow.querySelectorAll("img"));
  const previousButton = slideshow.querySelector(".slideshow-control-prev");
  const nextButton = slideshow.querySelector(".slideshow-control-next");
  const dotsContainer = slideshow.querySelector(".slideshow-dots");
  let currentIndex = 0;

  if (slides.length === 0) {
    return;
  }

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to rapport slide ${index + 1}`);
    dotsContainer?.append(dot);
    return dot;
  });

  const updateFrameSize = (slide) => {
    const aspectRatio = slide.naturalWidth && slide.naturalHeight
      ? slide.naturalWidth / slide.naturalHeight
      : 4 / 3;

    slideshow.style.aspectRatio = String(aspectRatio);
  };

  const showSlide = (index) => {
    const activeSlide = slides[index];

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });

    if (activeSlide.complete) {
      updateFrameSize(activeSlide);
    } else {
      activeSlide.addEventListener("load", () => updateFrameSize(activeSlide), { once: true });
    }
  };

  const goToSlide = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    showSlide(currentIndex);
  };

  showSlide(currentIndex);

  previousButton?.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToSlide(index);
    });
  });
});

const books = document.querySelectorAll("[data-book]");

books.forEach((book) => {
  const pages = Array.from(book.querySelectorAll(".book-pages img"));
  const page = book.querySelector(".book-page");
  const previousButton = book.querySelector(".book-prev");
  const nextButton = book.querySelector(".book-next");
  const status = book.querySelector(".book-status");
  let pageIndex = 0;
  let isTurning = false;

  if (pages.length === 0 || !page) {
    return;
  }

  const updateBook = () => {
    const currentImage = pages[pageIndex];
    page.style.backgroundImage = `url("${currentImage.src}")`;

    previousButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex === pages.length - 1;
    status.textContent = `Page ${pageIndex + 1} of ${pages.length}`;
  };

  const turnTo = (nextIndex, direction) => {
    const boundedIndex = Math.max(0, Math.min(nextIndex, pages.length - 1));

    if (boundedIndex === pageIndex || isTurning) {
      return;
    }

    isTurning = true;
    book.classList.add(direction === "next" ? "is-turning-next" : "is-turning-prev");

    window.setTimeout(() => {
      pageIndex = boundedIndex;
      updateBook();
    }, 260);

    window.setTimeout(() => {
      book.classList.remove("is-turning-next", "is-turning-prev");
      isTurning = false;
    }, 460);
  };

  previousButton.addEventListener("click", () => turnTo(pageIndex - 1, "prev"));
  nextButton.addEventListener("click", () => turnTo(pageIndex + 1, "next"));
  page.addEventListener("click", () => turnTo(pageIndex + 1, "next"));

  updateBook();
});
