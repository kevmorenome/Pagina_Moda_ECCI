/* ============================================================
   MODA ECCI — main.js
   Conferencia de Teoría del Color · Sara Viloria
   ------------------------------------------------------------
   Índice:
   1. Utilidades de color (HSL → HEX)
   2. Selector de idioma ES / EN
   3. Barra de progreso + navbar al hacer scroll
   4. Animaciones de aparición al hacer scroll (reveal)
   5. Rueda / círculo cromático interactivo
   6. Galería — modal con detalle de imagen
   7. Glosario — buscador y filtro por categoría
   8. Año dinámico en el footer
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     1. UTILIDADES DE COLOR
     ============================================================ */

  /** Convierte un color HSL (h en grados, s y l de 0 a 1) a HEX */
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (v) => {
      const hex = Math.round((v + m) * 255).toString(16).padStart(2, "0");
      return hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /* ============================================================
     2. SELECTOR DE IDIOMA ES / EN
     ============================================================ */
  const LANG_KEY = "ecci-lang";

  function getStoredLang() {
    try {
      return localStorage.getItem(LANG_KEY) || "es";
    } catch (e) {
      return "es";
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* almacenamiento no disponible: continuar sin persistencia */
    }
  }

  function applyLang(lang) {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "es");

    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      const isActive = btn.getAttribute("data-lang-option") === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    // Placeholders bilingües (p. ej. el buscador del glosario)
    document.querySelectorAll("[data-placeholder-es]").forEach((el) => {
      const text = lang === "en" ? el.dataset.placeholderEn : el.dataset.placeholderEs;
      if (text) el.setAttribute("placeholder", text);
    });

    // Avisar a otros módulos (p. ej. el círculo cromático) de que el
    // idioma cambió, para que puedan refrescar sus textos dinámicos.
    document.dispatchEvent(new CustomEvent("ecci:langchange", { detail: { lang } }));
  }

  function initLanguageToggle() {
    const lang = getStoredLang();
    applyLang(lang);

    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chosen = btn.getAttribute("data-lang-option");
        storeLang(chosen);
        applyLang(chosen);
      });
    });
  }

  /* ============================================================
     3. BARRA DE PROGRESO + NAVBAR AL HACER SCROLL
     ============================================================ */
  function initScrollChrome() {
    const bar = document.querySelector(".progress-rail__bar");
    const nav = document.querySelector(".navbar-ecci");

    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
      if (nav) nav.classList.toggle("is-scrolled", scrollTop > 40);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ============================================================
     4. ANIMACIONES DE APARICIÓN AL HACER SCROLL
     ============================================================ */
  function initRevealAnimations() {
    const targets = document.querySelectorAll(".reveal, .reveal-stagger");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     5. RUEDA / CÍRCULO CROMÁTICO INTERACTIVO
     ============================================================ */
  const WHEEL_NAMES = [
    { es: "Rojo", en: "Red" },
    { es: "Rojo-naranja", en: "Red-orange" },
    { es: "Naranja", en: "Orange" },
    { es: "Naranja-amarillo", en: "Yellow-orange" },
    { es: "Amarillo", en: "Yellow" },
    { es: "Amarillo-verde", en: "Yellow-green" },
    { es: "Verde", en: "Green" },
    { es: "Verde-azul", en: "Blue-green" },
    { es: "Azul", en: "Blue" },
    { es: "Azul-violeta", en: "Blue-violet" },
    { es: "Violeta", en: "Violet" },
    { es: "Rojo-violeta", en: "Red-violet" },
  ];

  const WHEEL_RELATIONS = {
    complementario: {
      offsets: [0, 180],
      label: { es: "Complementarios", en: "Complementary" },
      desc: {
        es: "Dos colores opuestos en el círculo cromático. El contraste entre ellos es máximo: cuando se combinan, cada uno hace que el otro se vea más intenso. En interfaces, esta relación es útil para botones de acción o alertas que deben destacar sobre el resto, siempre cuidando el contraste de accesibilidad.",
        en: "Two colors sitting opposite each other on the wheel. Their contrast is at its peak: placed together, each makes the other look more vivid. In interfaces this relationship works well for action buttons or alerts that need to stand out, as long as accessibility contrast is checked.",
      },
    },
    analogos: {
      offsets: [-30, 0, 30],
      label: { es: "Análogos", en: "Analogous" },
      desc: {
        es: "Tres colores vecinos en el círculo. Comparten una temperatura similar, por lo que generan paletas armónicas y de bajo contraste, ideales para fondos, degradados o estados de una misma familia (por ejemplo, una escala de éxito en verde).",
        en: "Three neighbouring colors on the wheel. They share a similar temperature, producing harmonious, low-contrast palettes — ideal for backgrounds, gradients or different states within the same family (for example, a scale of greens for success states).",
      },
    },
    triada: {
      offsets: [0, 120, 240],
      label: { es: "Tríada", en: "Triad" },
      desc: {
        es: "Tres colores ubicados a la misma distancia entre sí (120°). Producen paletas vibrantes y equilibradas. En UI conviene usar uno como color dominante, otro como secundario y el tercero como acento puntual.",
        en: "Three colors placed at equal distances from each other (120°). They create vibrant, balanced palettes. In UI it works well to use one as the dominant color, another as secondary, and the third as a small accent.",
      },
    },
    cuadrado: {
      offsets: [0, 90, 180, 270],
      label: { es: "Cuadrado cromático", en: "Color square" },
      desc: {
        es: "Cuatro colores separados por 90°, formando dos pares de complementarios. Ofrece mucha variedad, pero conviene elegir un color dominante y usar los demás como apoyo para no perder jerarquía visual.",
        en: "Four colors spaced 90° apart, forming two complementary pairs. It offers a lot of variety, but it helps to pick one dominant color and use the rest as support so the visual hierarchy stays clear.",
      },
    },
    rectangulo: {
      offsets: [0, 60, 180, 240],
      label: { es: "Rectángulo cromático", en: "Color rectangle" },
      desc: {
        es: "Dos pares de complementarios con espaciados desiguales (60° y 120°). Mantiene el contraste de los complementarios, pero con una combinación menos simétrica y más particular, ideal para identidades de marca distintivas.",
        en: "Two complementary pairs with uneven spacing (60° and 120°). It keeps the contrast of complementary colors but feels less symmetrical and more distinctive — useful for memorable brand identities.",
      },
    },
  };

  function initColorWheel() {
    const svg = document.getElementById("color-wheel-svg");
    if (!svg) return;

    const cx = 150, cy = 150, rOuter = 142, rInner = 58;
    const wedgesGroup = svg.querySelector("#cw-wedges");
    const labelMain = svg.querySelector("#cw-label-main");
    const labelSub = svg.querySelector("#cw-label-sub");

    function polar(r, angleDeg) {
      const a = ((angleDeg - 90) * Math.PI) / 180;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }

    function donutPath(startAngle, endAngle) {
      const so = polar(rOuter, startAngle);
      const eo = polar(rOuter, endAngle);
      const ei = polar(rInner, endAngle);
      const si = polar(rInner, startAngle);
      return [
        `M ${so.x.toFixed(2)} ${so.y.toFixed(2)}`,
        `A ${rOuter} ${rOuter} 0 0 1 ${eo.x.toFixed(2)} ${eo.y.toFixed(2)}`,
        `L ${ei.x.toFixed(2)} ${ei.y.toFixed(2)}`,
        `A ${rInner} ${rInner} 0 0 0 ${si.x.toFixed(2)} ${si.y.toFixed(2)}`,
        "Z",
      ].join(" ");
    }

    // Construir los 12 segmentos
    const wedges = [];
    for (let i = 0; i < 12; i++) {
      const startAngle = i * 30;
      const endAngle = startAngle + 30;
      const hue = startAngle;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", donutPath(startAngle, endAngle));
      path.setAttribute("fill", hslToHex(hue + 15, 0.62, 0.56));
      path.classList.add("cw-wedge");
      path.dataset.hue = String(hue);
      path.dataset.index = String(i);
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute(
        "aria-label",
        `${WHEEL_NAMES[i].es} — ${hslToHex(hue + 15, 0.62, 0.56)}`
      );
      wedgesGroup.appendChild(path);
      wedges.push(path);
    }

    let currentBase = 0; // índice 0-11 (rojo)
    let currentRelation = "complementario";

    function currentLang() {
      return document.documentElement.getAttribute("data-lang") || "es";
    }

    function render() {
      const relation = WHEEL_RELATIONS[currentRelation];
      const relatedIndexes = relation.offsets.map((off) => {
        return (((currentBase * 30 + off) / 30) % 12 + 12) % 12;
      });

      wedges.forEach((wedge, i) => {
        wedge.classList.remove("is-selected", "is-related", "is-dim");
        if (i === currentBase) {
          wedge.classList.add("is-selected");
        } else if (relatedIndexes.includes(i)) {
          wedge.classList.add("is-related");
        } else {
          wedge.classList.add("is-dim");
        }
      });

      const lang = currentLang();
      const baseHue = currentBase * 30;
      const baseHex = hslToHex(baseHue + 15, 0.62, 0.56);
      labelMain.textContent = WHEEL_NAMES[currentBase][lang];
      labelSub.textContent = baseHex;

      // Texto explicativo
      const titleEl = document.getElementById("wheel-explainer-title");
      const descEl = document.getElementById("wheel-explainer-desc");
      if (titleEl) titleEl.textContent = relation.label[lang];
      if (descEl) descEl.textContent = relation.desc[lang];

      // Botones activos
      document.querySelectorAll(".wheel-controls button").forEach((btn) => {
        const isActive = btn.dataset.relation === currentRelation;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      // Paleta resultante
      const paletteEl = document.getElementById("wheel-palette");
      if (paletteEl) {
        paletteEl.innerHTML = "";
        relatedIndexes
          .slice()
          .sort((a, b) => a - b)
          .forEach((idx) => {
            const hue = idx * 30;
            const hex = hslToHex(hue + 15, 0.62, 0.56);
            const swatch = document.createElement("div");
            swatch.className = "swatch";
            swatch.style.backgroundColor = hex;
            swatch.innerHTML = `<span>${hex}</span>`;
            swatch.title = WHEEL_NAMES[idx][lang];
            paletteEl.appendChild(swatch);
          });
      }
    }

    wedges.forEach((wedge) => {
      wedge.addEventListener("click", () => {
        currentBase = parseInt(wedge.dataset.index, 10);
        render();
      });
      wedge.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          currentBase = parseInt(wedge.dataset.index, 10);
          render();
        }
      });
    });

    document.querySelectorAll(".wheel-controls button").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentRelation = btn.dataset.relation;
        render();
      });
    });

    document.addEventListener("ecci:langchange", render);

    render();
  }

  /* ============================================================
     6. GALERÍA — MODAL CON DETALLE DE IMAGEN
     ============================================================ */
  function initGalleryModal() {
    const modalEl = document.getElementById("galeria-modal");
    if (!modalEl || typeof bootstrap === "undefined") return;

    const modal = new bootstrap.Modal(modalEl);
    const modalImg = modalEl.querySelector("#galeria-modal-img");
    const modalCounter = modalEl.querySelector("#galeria-modal-counter");

    const items = Array.from(document.querySelectorAll(".gallery-grid__item"));

    items.forEach((item, index) => {
      item.addEventListener("click", () => {
        openAt(index);
      });
    });

    function openAt(index) {
      const item = items[index];
      if (!item) return;
      const img = item.querySelector("img");
      modalImg.src = img.src;
      modalImg.alt = img.alt;
      modalCounter.textContent = `${index + 1} / ${items.length}`;
      modalEl.dataset.activeIndex = String(index);
      modal.show();
    }

    const prevBtn = modalEl.querySelector("#galeria-modal-prev");
    const nextBtn = modalEl.querySelector("#galeria-modal-next");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const i = parseInt(modalEl.dataset.activeIndex || "0", 10);
        openAt((i - 1 + items.length) % items.length);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const i = parseInt(modalEl.dataset.activeIndex || "0", 10);
        openAt((i + 1) % items.length);
      });
    }
  }

  /* ============================================================
     7. GLOSARIO — BUSCADOR Y FILTRO POR CATEGORÍA
     ============================================================ */
  function initGlossaryFilter() {
    const searchInput = document.getElementById("glossary-search");
    const cards = Array.from(document.querySelectorAll(".term-card"));
    const filterButtons = Array.from(document.querySelectorAll(".glossary-filter"));
    const noResults = document.getElementById("glossary-no-results");
    if (!cards.length) return;

    let activeCategory = "todos";

    function applyFilters() {
      const query = (searchInput && searchInput.value.trim().toLowerCase()) || "";
      let visibleCount = 0;

      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const category = card.dataset.category || "";
        const matchesQuery = query === "" || text.includes(query);
        const matchesCategory = activeCategory === "todos" || category === activeCategory;
        const visible = matchesQuery && matchesCategory;
        card.hidden = !visible;
        if (visible) visibleCount++;
      });

      if (noResults) noResults.hidden = visibleCount !== 0;
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.filter;
        filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
        applyFilters();
      });
    });

    applyFilters();
  }

  /* ============================================================
     8. AÑO DINÁMICO EN EL FOOTER
     ============================================================ */
  function setFooterYear() {
    const el = document.getElementById("current-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ============================================================
     INICIALIZACIÓN
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    initLanguageToggle();
    initScrollChrome();
    initRevealAnimations();
    initColorWheel();
    initGalleryModal();
    initGlossaryFilter();
    setFooterYear();

    // Botón "scroll" del hero
    const scrollCue = document.querySelector(".hero__scroll");
    if (scrollCue) {
      scrollCue.style.cursor = "pointer";
      scrollCue.addEventListener("click", () => {
        const next = document.querySelector("#galeria");
        if (next) next.scrollIntoView({ behavior: "smooth" });
      });
    }
  });
})();
