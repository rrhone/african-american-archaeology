
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const themeSections = document.querySelectorAll(".theme-section");

  themeSections.forEach((section) => {
    const heading = section.querySelector("h2.section-heading");
    if (!heading) return;

    // Make it visually clickable
    heading.classList.add("theme-toggle");

    // Start expanded (optional: add "collapsed" class here if you want them closed by default)
    section.classList.remove("collapsed");

    heading.addEventListener("click", () => {
      section.classList.toggle("collapsed");
    });
  });
});
