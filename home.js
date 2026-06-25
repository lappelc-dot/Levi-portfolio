const slideshows = document.querySelectorAll("[data-slideshow]");

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
