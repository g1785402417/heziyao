(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var header = doc.querySelector("[data-site-header]");
  var progressBar = doc.querySelector("[data-scroll-progress]");
  var backToTop = doc.querySelector("[data-back-to-top]");
  var nav = doc.querySelector("[data-primary-nav]");
  var menuToggle = doc.querySelector("[data-menu-toggle]");
  var toast = doc.querySelector("[data-toast]");
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll("[data-nav-link]"));
  var toastTimer = null;
  var ticking = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getScrollTop() {
    return window.pageYOffset || doc.documentElement.scrollTop || 0;
  }

  function updateScrollUI() {
    var scrollTop = getScrollTop();
    var docHeight = doc.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? clamp(scrollTop / docHeight, 0, 1) : 0;

    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 18);
    }

    if (progressBar) {
      progressBar.style.width = (progress * 100).toFixed(2) + "%";
    }

    if (backToTop) {
      backToTop.classList.toggle("is-visible", scrollTop > 520);
      var ring = backToTop.querySelector(".ring");
      if (ring) {
        var circumference = 2 * Math.PI * 21;
        ring.style.strokeDashoffset = String(circumference * (1 - progress));
      }
    }

    var sections = ["about", "skills", "practice", "honors", "growth"];
    var marker = scrollTop + window.innerHeight * 0.33;
    var current = "";

    sections.forEach(function (id) {
      var section = doc.getElementById(id);
      if (section && section.offsetTop <= marker) {
        current = id;
      }
    });

    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", current !== "" && link.getAttribute("href") === "#" + current);
    });
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateScrollUI();
      ticking = false;
    });
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  window.addEventListener("load", requestScrollUpdate);
  updateScrollUI();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* Mobile navigation ------------------------------------------------------ */
  function openMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "关闭导航菜单");
    doc.body.classList.add("menu-open");
    var firstLink = nav.querySelector("a");
    if (firstLink) {
      window.setTimeout(function () {
        firstLink.focus({ preventScroll: true });
      }, 30);
    }
  }

  function closeMenu(returnFocus) {
    if (!nav || !menuToggle || !nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "打开导航菜单");
    doc.body.classList.remove("menu-open");
    if (returnFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (link) {
        closeMenu(false);
      }
    });

    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu(true);
      }
    });

    doc.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080 && nav.classList.contains("is-open")) {
        closeMenu(false);
      }
    });
  }

  /* Reveal on scroll ------------------------------------------------------ */
  var revealTargets = Array.prototype.slice.call(
    doc.querySelectorAll(
      ".section-head, .about-quote, .about-copy, .principle, .profile-strip, .skill-card, .spotlight, .support-loop, .timeline-item, .campus-card, .honor-feature, .honor-card, .qualification-strip, .more-honors, .growth-step, .growth-honest, .contact-card"
    )
  );

  if (!reduceMotion && "IntersectionObserver" in window && revealTargets.length) {
    try {
      revealTargets.forEach(function (element) {
        var siblings = element.parentElement
          ? Array.prototype.slice.call(element.parentElement.children).filter(function (child) {
              return child.classList && revealTargets.indexOf(child) !== -1;
            })
          : [];
        var index = Math.max(0, siblings.indexOf(element));
        element.style.setProperty("--delay", String(Math.min(index, 6) * 70) + "ms");
        element.classList.add("reveal");
      });

      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );

      revealTargets.forEach(function (element) {
        revealObserver.observe(element);
      });
    } catch (error) {
      revealTargets.forEach(function (element) {
        element.classList.remove("reveal");
      });
    }
  }

  /* Count-up numbers ------------------------------------------------------ */
  var counters = Array.prototype.slice.call(doc.querySelectorAll("[data-count]"));

  function animateCounter(element) {
    var target = Number(element.getAttribute("data-count"));
    if (!isFinite(target)) return;

    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }

    var duration = 1200;
    var start = null;

    function frame(timestamp) {
      if (start === null) start = timestamp;
      var progress = clamp((timestamp - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      }
    }

    window.requestAnimationFrame(frame);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (counter) {
        counterObserver.observe(counter);
      });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* Pointer tilt ---------------------------------------------------------- */
  var tiltElement = doc.querySelector("[data-tilt]");

  if (tiltElement && finePointer && !reduceMotion) {
    var tiltFrame = null;

    tiltElement.addEventListener(
      "pointermove",
      function (event) {
        if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
        tiltFrame = window.requestAnimationFrame(function () {
          var rect = tiltElement.getBoundingClientRect();
          var x = (event.clientX - rect.left) / rect.width - 0.5;
          var y = (event.clientY - rect.top) / rect.height - 0.5;
          tiltElement.style.setProperty("--ry", (x * 4.5).toFixed(2) + "deg");
          tiltElement.style.setProperty("--rx", (-y * 4.5).toFixed(2) + "deg");
          tiltElement.style.setProperty("--py", (-y * 4).toFixed(2) + "px");
        });
      },
      { passive: true }
    );

    tiltElement.addEventListener("pointerleave", function () {
      tiltElement.style.setProperty("--ry", "0deg");
      tiltElement.style.setProperty("--rx", "0deg");
      tiltElement.style.setProperty("--py", "0px");
    });
  }

  /* Card spotlight -------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    doc.querySelectorAll("[data-spotlight]").forEach(function (card) {
      card.addEventListener(
        "pointermove",
        function (event) {
          var rect = card.getBoundingClientRect();
          card.style.setProperty("--mx", (((event.clientX - rect.left) / rect.width) * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (((event.clientY - rect.top) / rect.height) * 100).toFixed(1) + "%");
        },
        { passive: true }
      );
    });
  }

  /* Copy email ------------------------------------------------------------ */
  var copyButton = doc.querySelector("[data-copy-email]");

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function legacyCopy(text) {
    var field = doc.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    doc.body.appendChild(field);
    field.select();
    var succeeded = false;
    try {
      succeeded = doc.execCommand("copy");
    } catch (error) {
      succeeded = false;
    }
    doc.body.removeChild(field);
    return succeeded;
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var email = copyButton.getAttribute("data-email") || "";
      if (!email) return;

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(email)
          .then(function () {
            showToast("邮箱已复制");
          })
          .catch(function () {
            showToast(legacyCopy(email) ? "邮箱已复制" : "复制失败，请手动选择邮箱");
          });
      } else {
        showToast(legacyCopy(email) ? "邮箱已复制" : "复制失败，请手动选择邮箱");
      }
    });
  }

  /* Footer year ----------------------------------------------------------- */
  doc.querySelectorAll("[data-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });
})();
