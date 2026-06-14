document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.getElementById("color-carousel");
  const lightbox = document.getElementById("gallery-lightbox");
  if (!carousel || !lightbox) return;

  const track = document.getElementById("carousel-track");
  const viewport = document.getElementById("carousel-viewport");
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const prevBtn = carousel.querySelector(".carousel-prev");
  const nextBtn = carousel.querySelector(".carousel-next");
  const counterEl = document.getElementById("carousel-current");
  const dotsContainer = document.getElementById("carousel-dots");
  const lightboxImg = lightbox.querySelector(".lightbox-img");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  const backdrop = lightbox.querySelector(".lightbox-backdrop");

  const total = slides.length;
  let current = 0;
  let dragStartX = 0;
  let isDragging = false;
  let autoplayTimer = null;
  const AUTOPLAY_MS = 2500;

  const MAX_VISIBLE = 2;

  function getSpacing() {
    return window.innerWidth < 768 ? 220 : window.innerWidth < 1024 ? 260 : 300;
  }

  function pad(n) {
    return String(n + 1).padStart(2, "0");
  }

  function updateGalleryI18n(lang) {
    const t = (key) => (window.ModaECCI ? window.ModaECCI.t(lang, key) : "");

    if (prevBtn) prevBtn.setAttribute("aria-label", t("galeria.prev"));
    if (nextBtn) nextBtn.setAttribute("aria-label", t("galeria.next"));
    if (dotsContainer) dotsContainer.setAttribute("aria-label", t("galeria.dots"));
    if (closeBtn) closeBtn.setAttribute("aria-label", t("galeria.close"));

    dotsContainer.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.setAttribute("aria-label", `${t("galeria.dot")} ${pad(i)}`);
    });
  }

  function wrap(index) {
    return ((index % total) + total) % total;
  }

  function getOffset(index) {
    let diff = index - current;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  }

  function updateCarousel() {
    slides.forEach((slide, i) => {
      const offset = getOffset(i);
      const abs = Math.abs(offset);
      const hidden = abs > MAX_VISIBLE;

      slide.classList.toggle("is-active", offset === 0);
      slide.style.zIndex = String(20 - abs);
      slide.style.opacity = hidden ? "0" : String(Math.max(0.25, 1 - abs * 0.28));
      slide.style.pointerEvents = abs <= 1 ? "auto" : "none";
      slide.style.filter = offset === 0 ? "brightness(1)" : `brightness(${0.72 - abs * 0.08})`;

      const tx = offset * getSpacing();
      const scale = offset === 0 ? 1 : Math.max(0.72, 1 - abs * 0.14);
      const rotateY = offset * -22;
      const tz = offset === 0 ? 40 : -abs * 60;

      slide.style.transform = `
        translate(-50%, -50%)
        translateX(${tx}px)
        translateZ(${tz}px)
        scale(${scale})
        rotateY(${rotateY}deg)
      `;
    });

    if (counterEl) counterEl.textContent = pad(current);

    dotsContainer.querySelectorAll(".carousel-dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === current);
      dot.setAttribute("aria-selected", i === current ? "true" : "false");
    });
  }

  function goTo(index) {
    current = wrap(index);
    updateCarousel();
    resetAutoplay();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      if (isDragging || !lightbox.hidden) return;
      current = wrap(current + 1);
      updateCarousel();
    }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    if (carousel.matches(":hover") || !lightbox.hidden || document.hidden) return;
    startAutoplay();
  }

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Ir a tarjeta ${pad(i)}`);
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  slides.forEach((slide) => {
    slide.addEventListener("click", () => {
      const index = Number(slide.dataset.index);
      if (index !== current) {
        goTo(index);
        return;
      }
      const img = slide.querySelector(".gallery-card-frame img");
      if (img) openLightbox(img.src, img.alt);
    });
  });

  viewport.addEventListener("pointerdown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(e.pointerId);
    stopAutoplay();
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });

  viewport.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next();
      else prev();
    }
    isDragging = false;
    viewport.classList.remove("is-dragging");
    resetAutoplay();
  });

  viewport.addEventListener("pointercancel", () => {
    isDragging = false;
    viewport.classList.remove("is-dragging");
    resetAutoplay();
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  const carouselObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) startAutoplay();
        else stopAutoplay();
      });
    },
    { threshold: 0.25 }
  );
  carouselObserver.observe(carousel);

  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.hidden && e.key === "Escape") {
      closeLightbox();
      return;
    }
    const rect = carousel.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView || !lightbox.hidden) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  function openLightbox(src, alt) {
    stopAutoplay();
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    resetAutoplay();
  }

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);

  updateCarousel();
  startAutoplay();
  window.addEventListener("resize", updateCarousel);

  updateGalleryI18n(window.ModaECCI ? window.ModaECCI.getLang() : "es");
  document.addEventListener("languagechange", (e) => {
    updateGalleryI18n(e.detail.lang);
  });
});
