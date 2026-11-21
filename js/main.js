// Shared behavior: language toggle, scroll reveal, diagram reveal, hero effects.
(function () {
  const root = document.documentElement;

  // --- language ---
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  const initial = saved || ((navigator.language || "pt").toLowerCase().startsWith("pt") ? "pt" : "en");
  setLang(initial);

  function setLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang === "pt" ? "pt-BR" : "en";
    document.querySelectorAll(".lang-toggle").forEach(b => (b.textContent = lang === "pt" ? "EN" : "PT"));
    try { localStorage.setItem("lang", lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }
  document.addEventListener("click", e => {
    if (e.target.closest(".lang-toggle")) setLang(root.dataset.lang === "pt" ? "en" : "pt");
  });

  // --- reveal on scroll (.reveal and svg.diagram) ---
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      // stagger diagram nodes
      en.target.querySelectorAll?.(".node").forEach((n, i) => (n.style.transitionDelay = i * 90 + "ms"));
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal, .diagram").forEach(el => io.observe(el));

  // --- typing effect: <h2 data-type-pt="a|b" data-type-en="c|d"> ---
  const typed = document.querySelector("[data-type-pt]");
  if (typed) {
    let timer;
    const run = () => {
      clearTimeout(timer);
      const words = typed.dataset["type" + (root.dataset.lang === "pt" ? "Pt" : "En")].split("|");
      let w = 0, c = 0, del = false;
      const tick = () => {
        const word = words[w];
        c += del ? -1 : 1;
        typed.innerHTML = word.slice(0, c) + '<span class="caret">&nbsp;</span>';
        let delay = del ? 30 : 60;
        if (!del && c === word.length) { del = true; delay = 1600; }
        else if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 300; }
        timer = setTimeout(tick, delay);
      };
      tick();
    };
    run();
    document.addEventListener("langchange", run);
  }

  // --- hero canvas: node graph drifting, linked when close ---
  const cv = document.getElementById("net");
  if (cv && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const ctx = cv.getContext("2d");
    let W, H, pts;
    const resize = () => {
      W = cv.width = cv.offsetWidth * devicePixelRatio;
      H = cv.height = cv.offsetHeight * devicePixelRatio;
      const n = Math.min(90, Math.floor((W * H) / (26000 * devicePixelRatio)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35 * devicePixelRatio, vy: (Math.random() - .5) * .35 * devicePixelRatio,
      }));
    };
    resize();
    addEventListener("resize", resize);
    const max = 140 * devicePixelRatio;
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < max) {
            ctx.strokeStyle = `rgba(57,255,159,${(1 - d / max) * .35})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = "#4cc9ff";
        ctx.fillRect(pts[i].x - 1.5, pts[i].y - 1.5, 3, 3);
      }
      requestAnimationFrame(frame);
    })();
  }
})();
