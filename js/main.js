(function () {
  "use strict";

  /* ---------- i18n ---------- */

  var I18N = {
    es: {
      "meta.title": "Martín Andersen · electrónica, firmware y web",
      "meta.desc": "Diseño electrónico, diseño de producto, programación embebida y desarrollo web. Del esquemático al producto final.",
      "nav.projects": "proyectos",
      "nav.contact": "contacto",
      "hero.sub": "Diseño electrónica y producto, programo firmware embebido y aplicaciones web. Del esquemático al producto final.",
      "chip.electronics": "electrónica",
      "chip.product": "producto",
      "chip.embedded": "embebido",
      "chip.3d": "diseño 3D",
      "node.hw": "hardware",
      "node.fw": "firmware",
      "node.d3": "diseño 3D",
      "node.p3": "impresión 3D",
      "node.prod": "diseño de producto",
      "node.web": "web",
      "term.make": "make producto_final",
      "term.chain": "esquemático → pcb → firmware → 3d → producto",
      "sec.projects": "proyectos destacados",
      "ideaalab.desc": "Electrónica, magia e innovación: productos propios, tutoriales y proyectos con mandos a distancia, servos y microcontroladores.",
      "cronum.desc": "Estudio de proyectos digitales y herramientas de productividad. Web próximamente.",
      "papatalk.desc": "App web para comunicarse con personas hospitalizadas que no pueden hablar —intubadas o con dificultades de comunicación verbal— pero que conservan movilidad en las manos.",
      "tag.education": "educación",
      "tag.soon": "próximamente",
      "tag.accessibility": "accesibilidad",
      "tag.health": "salud",
      "os.note": "Cargado en vivo desde",
      "ccs.title": "librerías CCS",
      "ccs.sub": "Librerías en C de CCS para microcontroladores PIC",
      "ha.sub": "Componentes e integraciones para Home Assistant",
      "wp.title": "plugins WordPress",
      "wp.sub": "Plugins para WordPress y WooCommerce",
      "tools.title": "herramientas",
      "tools.sub": "Analizadores lógicos y utilidades de radiofrecuencia",
      "other.title": "otros proyectos",
      "other.sub": "Otros proyectos personales",
      "sec.contact": "contacto",
      "footer.note": "hecho a mano — sin frameworks, sin cookies",
      "status.loading": "cargando repos…",
      "status.empty": "sin repos en esta categoría (todavía)",
      "status.error": "no se pudieron cargar los repos — visita "
    },
    en: {
      "meta.title": "Martín Andersen · electronics, firmware & web",
      "meta.desc": "Electronic design, product design, embedded programming and web development. From schematic to final product.",
      "nav.projects": "projects",
      "nav.contact": "contact",
      "hero.sub": "I design electronics and products, and write embedded firmware and web applications. From schematic to final product.",
      "chip.electronics": "electronics",
      "chip.product": "product",
      "chip.embedded": "embedded",
      "chip.3d": "3D design",
      "node.hw": "hardware",
      "node.fw": "firmware",
      "node.d3": "3D design",
      "node.p3": "3D printing",
      "node.prod": "product design",
      "node.web": "web",
      "term.make": "make final_product",
      "term.chain": "schematic → pcb → firmware → 3d → product",
      "sec.projects": "featured projects",
      "ideaalab.desc": "Electronics, magic and innovation: own products, tutorials and projects with remote controls, servos and microcontrollers.",
      "cronum.desc": "Studio for digital projects and productivity tools. Website coming soon.",
      "papatalk.desc": "Web app to communicate with hospitalized people who can't speak — intubated or with verbal-communication difficulties — but who keep some hand mobility.",
      "tag.education": "education",
      "tag.soon": "coming soon",
      "tag.accessibility": "accessibility",
      "tag.health": "health",
      "os.note": "Loaded live from",
      "ccs.title": "CCS libraries",
      "ccs.sub": "C libraries for PIC microcontrollers (CCS compiler)",
      "ha.sub": "Components and integrations for Home Assistant",
      "wp.title": "WordPress plugins",
      "wp.sub": "Plugins for WordPress and WooCommerce",
      "tools.title": "tools",
      "tools.sub": "Logic analyzers and radio frequency utilities",
      "other.title": "other projects",
      "other.sub": "Other personal projects",
      "sec.contact": "contact",
      "footer.note": "handmade — no frameworks, no cookies",
      "status.loading": "loading repos…",
      "status.empty": "no repos in this category (yet)",
      "status.error": "couldn't load the repos — visit "
    }
  };

  var LANG_KEY = "lang";
  var lang = null;
  try { lang = localStorage.getItem(LANG_KEY); } catch (e) { /* sin storage */ }
  if (lang !== "es" && lang !== "en") {
    lang = (navigator.language || "es").toLowerCase().indexOf("es") === 0 ? "es" : "en";
  }

  function t(key) { return I18N[lang][key]; }

  function applyLang(next) {
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* sin storage */ }

    document.documentElement.lang = lang;
    document.title = t("meta.title");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.desc"));

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = t(el.dataset.i18n);
      if (val != null) el.textContent = val;
    });

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    renderState();
  }

  document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.dataset.lang !== lang) applyLang(btn.dataset.lang);
    });
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ?motion=force ignora prefers-reduced-motion (para pruebas) */
  if (new URLSearchParams(location.search).get("motion") === "force") {
    document.body.classList.add("force-motion");
  } else if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("animate, animateMotion, set").forEach(function (el) {
      el.remove();
    });
  }

  /* ---------- repos de GitHub ---------- */

  var GH_USER = "martinandersen84";
  var API_URL = "https://api.github.com/users/" + GH_USER + "/repos?per_page=100&sort=pushed";
  var CACHE_KEY = "gh-repos-v3-" + GH_USER;
  var CACHE_TTL = 60 * 60 * 1000; // 1 hora

  var grids = document.querySelectorAll(".repo-grid[data-topic]");
  var state = { repos: null, status: "loading" };

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.data)) return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data }));
    } catch (e) { /* almacenamiento lleno o bloqueado: seguimos sin caché */ }
  }

  function slimRepo(r) {
    return {
      name: r.name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      topics: r.topics || [],
      pushed: r.pushed_at
    };
  }

  function statusNode(text) {
    var p = document.createElement("p");
    p.className = "repo-status";
    p.textContent = text;
    return p;
  }

  function clearDynamicCards(grid) {
    grid.querySelectorAll(".repo-card, .repo-status").forEach(function (el) { el.remove(); });
  }

  function renderState() {
    if (state.repos) { renderRepos(state.repos); return; }

    grids.forEach(function (grid) {
      clearDynamicCards(grid);
      if (state.status === "error") {
        var p = document.createElement("p");
        p.className = "repo-status";
        p.appendChild(document.createTextNode(t("status.error")));
        var link = document.createElement("a");
        link.href = "https://github.com/" + GH_USER;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "github.com/" + GH_USER;
        p.appendChild(link);
        grid.appendChild(p);
      } else {
        grid.appendChild(statusNode(t("status.loading")));
      }
    });
  }

  function renderRepos(repos) {
    grids.forEach(function (grid) {
      var topic = grid.dataset.topic;
      var list = repos
        .filter(function (r) { return r.topics.indexOf(topic) !== -1; })
        .sort(function (a, b) { return (b.stars - a.stars) || a.name.localeCompare(b.name); });

      clearDynamicCards(grid);
      grid.closest(".repo-group").hidden = list.length === 0 && !grid.querySelector(".repo-static");

      list.forEach(function (r) {
        var card = document.createElement("a");
        card.className = "card repo-card";
        card.href = r.url;
        card.target = "_blank";
        card.rel = "noopener";

        var head = document.createElement("div");
        head.className = "card-head";
        var title = document.createElement("h3");
        title.textContent = r.name;
        head.appendChild(title);
        card.appendChild(head);

        var desc = document.createElement("p");
        desc.textContent = r.description || "";
        card.appendChild(desc);

        var meta = document.createElement("div");
        meta.className = "repo-meta";
        if (r.stars > 0) {
          var stars = document.createElement("span");
          stars.innerHTML =
            '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7 6.6 19.6l1.1-6L3.2 9.4l6.1-.8z" ' +
            'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
          stars.appendChild(document.createTextNode(String(r.stars)));
          meta.appendChild(stars);
        }
        if (r.pushed) {
          var upd = document.createElement("span");
          upd.textContent = "upd " + r.pushed.slice(0, 4);
          meta.appendChild(upd);
        }
        if (meta.children.length > 0) card.appendChild(meta);

        grid.appendChild(card);
      });
    });
  }

  applyLang(lang);

  var cached = readCache();

  if (cached && Date.now() - cached.t < CACHE_TTL) {
    state.repos = cached.data;
    renderState();
  } else {
    fetch(API_URL, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (repos) {
        var slim = repos.map(slimRepo);
        writeCache(slim);
        state.repos = slim;
        renderState();
      })
      .catch(function () {
        if (cached) {
          state.repos = cached.data; // caché caducada mejor que nada
        } else {
          state.status = "error";
        }
        renderState();
      });
  }
})();
