document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );

  document.querySelectorAll(
    ".section-header, .section-title, .phen-card, .prop-card, .timeline-item, .harmony-card, .character-card, .quote, .fashion-panel, .speaker-portrait, .team-photo, .reveal-line, .color-carousel"
  ).forEach((el) => {
    if (!el.classList.contains("fade-in")) {
      el.classList.add("fade-in");
    }
    observer.observe(el);
  });
});
