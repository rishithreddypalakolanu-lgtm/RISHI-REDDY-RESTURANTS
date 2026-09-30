/* ==========================================================================
   RISHI RESTAURANTS — Site Logic
   Renders the menu from menu-data.js, handles category filtering, search,
   the shopping cart (persisted to localStorage), and small UI interactions.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------- State ---------------- */
  const CART_KEY = "rishi-restaurants-cart";
  const DELIVERY_FEE = 40;
  let cart = loadCart();
  let activeCategory = "all";
  let searchQuery = "";

  /* ---------------- Helpers ---------------- */
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function formatPrice(n) {
    return "₹" + n.toLocaleString("en-IN");
  }

  function starsHTML(rating) {
    return `<i class="fa-solid fa-star"></i> ${rating.toFixed(1)}`;
  }

  function findItem(id) {
    return MENU_ITEMS.find((item) => item.id === id);
  }

  function showToast(message, icon = "fa-circle-check") {
    const toast = document.getElementById("toast");
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  /* ---------------- Rendering: category filters ---------------- */
  function renderCategoryFilters() {
    const wrap = document.getElementById("category-filters");
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "cat-btn";
      btn.dataset.category = cat.id;
      btn.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${cat.label}`;
      wrap.appendChild(btn);
    });

    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".cat-btn");
      if (!btn) return;
      wrap.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      renderMenuGrid();
    });
  }

  /* ---------------- Rendering: footer categories ---------------- */
  function renderFooterCategories() {
    const wrap = document.getElementById("footer-categories");
    CATEGORIES.forEach((cat) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#menu" data-category-link="${cat.id}">${cat.label}</a>`;
      wrap.appendChild(li);
    });
    wrap.addEventListener("click", (e) => {
      const a = e.target.closest("[data-category-link]");
      if (!a) return;
      const catId = a.dataset.categoryLink;
      document.querySelectorAll(".cat-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.category === catId);
      });
      activeCategory = catId;
      renderMenuGrid();
    });
  }

  /* ---------------- Rendering: menu grid ---------------- */
  function menuCardHTML(item) {
    const inCart = cart[item.id];
    return `
      <article class="menu-card" data-id="${item.id}">
        <div class="menu-card-img">
          <img src="${item.img}" alt="${item.name}" loading="lazy" width="280" height="200" />
          <span class="veg-indicator ${item.veg ? "" : "non-veg"}" title="${item.veg ? "Vegetarian" : "Non-Vegetarian"}"></span>
          <span class="menu-card-rating">${starsHTML(item.rating)}</span>
        </div>
        <div class="menu-card-body">
          <div class="menu-card-title-row">
            <h3>${item.name}</h3>
            <span class="menu-card-price">${formatPrice(item.price)}</span>
          </div>
          <p>${item.desc}</p>
          <div class="menu-card-footer">
            <button class="add-to-cart-btn ${inCart ? "added" : ""}" data-add="${item.id}" ${inCart ? "hidden" : ""}>
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
            <div class="qty-stepper ${inCart ? "active" : ""}" data-stepper="${item.id}">
              <button data-decrease="${item.id}" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
              <span data-qty-display="${item.id}">${inCart ? inCart.qty : 0}</span>
              <button data-increase="${item.id}" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function getFilteredItems() {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }

  function renderMenuGrid() {
    const grid = document.getElementById("menu-grid");
    const noResults = document.getElementById("no-results");
    const items = getFilteredItems();

    grid.innerHTML = items.map(menuCardHTML).join("");
    noResults.hidden = items.length !== 0;
  }

  /* ---------------- Rendering: chef's specials ---------------- */
  function specialCardHTML(item) {
    return `
      <article class="special-card" data-id="${item.id}">
        <img src="${item.img.replace('w=500', 'w=600')}" alt="${item.name}" loading="lazy" width="600" height="380" />
        <div class="special-overlay"></div>
        <span class="special-badge">Chef's Special</span>
        <div class="special-content">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="special-footer">
            <span class="special-price">${formatPrice(item.price)}</span>
            <button class="special-add" data-add="${item.id}" aria-label="Add ${item.name} to cart">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderSpecials() {
    const grid = document.getElementById("specials-grid");
    const specials = MENU_ITEMS.filter((item) => item.special);
    grid.innerHTML = specials.map(specialCardHTML).join("");
  }

  /* ---------------- Cart logic ---------------- */
  function addToCart(id, qty = 1) {
    const item = findItem(id);
    if (!item) return;
    if (cart[id]) {
      cart[id].qty += qty;
    } else {
      cart[id] = { qty };
    }
    saveCart();
    syncCartUI();
    showToast(`${item.name} added to cart`, "fa-cart-plus");
  }

  function updateQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) {
      delete cart[id];
    }
    saveCart();
    syncCartUI();
  }

  function removeFromCart(id) {
    delete cart[id];
    saveCart();
    syncCartUI();
  }

  function clearCart() {
    cart = {};
    saveCart();
    syncCartUI();
    showToast("Cart cleared", "fa-trash");
  }

  function cartCount() {
    return Object.values(cart).reduce((sum, entry) => sum + entry.qty, 0);
  }

  function cartSubtotal() {
    return Object.entries(cart).reduce((sum, [id, entry]) => {
      const item = findItem(id);
      return item ? sum + item.price * entry.qty : sum;
    }, 0);
  }

  function cartItemHTML(id, entry) {
    const item = findItem(id);
    if (!item) return "";
    return `
      <div class="cart-item" data-id="${id}">
        <img src="${item.img}" alt="${item.name}" loading="lazy" width="68" height="68" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="cart-item-price">${formatPrice(item.price)}</span>
          <div class="cart-item-controls">
            <div class="cart-item-qty">
              <button data-decrease="${id}" aria-label="Decrease quantity"><i class="fa-solid fa-minus"></i></button>
              <span>${entry.qty}</span>
              <button data-increase="${id}" aria-label="Increase quantity"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button class="cart-item-remove" data-remove="${id}" aria-label="Remove ${item.name}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }

  function renderCartDrawer() {
    const wrap = document.getElementById("cart-items");
    const empty = document.getElementById("cart-empty");
    const footer = document.getElementById("cart-footer");
    const entries = Object.entries(cart);

    if (entries.length === 0) {
      wrap.innerHTML = "";
      empty.classList.add("visible");
      footer.style.display = "none";
      return;
    }

    empty.classList.remove("visible");
    footer.style.display = "block";
    wrap.innerHTML = entries.map(([id, entry]) => cartItemHTML(id, entry)).join("");

    const subtotal = cartSubtotal();
    const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
    document.getElementById("cart-subtotal").textContent = formatPrice(subtotal);
    document.getElementById("cart-delivery").textContent = formatPrice(delivery);
    document.getElementById("cart-total").textContent = formatPrice(subtotal + delivery);
  }

  /* Sync all UI surfaces that reflect cart state (badge, drawer, in-card steppers) */
  function syncCartUI() {
    document.getElementById("cart-count").textContent = cartCount();
    renderCartDrawer();

    // Update menu-card / special-card add buttons & steppers in place, no full re-render
    document.querySelectorAll("[data-stepper]").forEach((stepper) => {
      const id = stepper.dataset.stepper;
      const entry = cart[id];
      const card = stepper.closest(".menu-card");
      const addBtn = card ? card.querySelector(`[data-add="${id}"]`) : null;
      if (entry) {
        stepper.classList.add("active");
        if (addBtn) addBtn.hidden = true;
        const display = stepper.querySelector(`[data-qty-display="${id}"]`);
        if (display) display.textContent = entry.qty;
      } else {
        stepper.classList.remove("active");
        if (addBtn) addBtn.hidden = false;
      }
    });
  }

  /* ---------------- Event delegation: add / qty buttons anywhere on page ---------------- */
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add]");
    const incBtn = e.target.closest("[data-increase]");
    const decBtn = e.target.closest("[data-decrease]");
    const removeBtn = e.target.closest("[data-remove]");

    if (addBtn) addToCart(addBtn.dataset.add);
    if (incBtn) updateQty(incBtn.dataset.increase, 1);
    if (decBtn) updateQty(decBtn.dataset.decrease, -1);
    if (removeBtn) removeFromCart(removeBtn.dataset.remove);
  });

  /* ---------------- Cart drawer open/close ---------------- */
  function initCartDrawer() {
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");

    function open() {
      drawer.classList.add("open");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      drawer.classList.remove("open");
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    document.getElementById("cart-toggle").addEventListener("click", open);
    document.getElementById("cart-close").addEventListener("click", close);
    overlay.addEventListener("click", close);
    document.getElementById("cart-clear").addEventListener("click", clearCart);
    document.getElementById("cart-empty-browse").addEventListener("click", close);
    document.getElementById("cart-checkout").addEventListener("click", () => {
      if (cartCount() === 0) return;
      window.dispatchEvent(new CustomEvent("rishi:open-checkout"));
    });
  }

  window.addEventListener("rishi:order-completed", () => {
    cart = {};
    saveCart();
    syncCartUI();
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("cart-overlay");
    if (drawer) drawer.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  });

  /* ---------------- Search (header overlay + menu section) ---------------- */
  function initSearch() {
    const searchBar = document.getElementById("search-bar");
    const searchToggle = document.getElementById("search-toggle");
    const searchClose = document.getElementById("search-close");
    const searchInput = document.getElementById("search-input");
    const menuSearchInput = document.getElementById("menu-search-input");

    searchToggle.addEventListener("click", () => {
      const isOpen = searchBar.classList.toggle("open");
      searchToggle.setAttribute("aria-expanded", isOpen);
      if (isOpen) setTimeout(() => searchInput.focus(), 300);
    });
    searchClose.addEventListener("click", () => {
      searchBar.classList.remove("open");
      searchToggle.setAttribute("aria-expanded", "false");
    });

    function runSearch(value) {
      searchQuery = value.trim().toLowerCase();
      renderMenuGrid();
      if (searchQuery) {
        document.getElementById("menu").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    searchInput.addEventListener("input", () => {
      menuSearchInput.value = searchInput.value;
      runSearch(searchInput.value);
    });
    menuSearchInput.addEventListener("input", () => {
      searchInput.value = menuSearchInput.value;
      runSearch(menuSearchInput.value);
    });
  }

  /* ---------------- Mobile nav ---------------- */
  function initMobileNav() {
    const hamburger = document.getElementById("hamburger");
    const nav = document.getElementById("mobile-nav");
    const overlay = document.getElementById("mobile-nav-overlay");
    const closeBtn = document.getElementById("mobile-nav-close");

    function open() {
      nav.classList.add("open");
      overlay.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function close() {
      nav.classList.remove("open");
      overlay.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    hamburger.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);
    nav.querySelectorAll(".mobile-nav-link").forEach((link) => link.addEventListener("click", close));
  }

  /* ---------------- Sticky header + active nav link on scroll ---------------- */
  function initHeaderScroll() {
    const header = document.getElementById("site-header");
    const sections = ["home", "menu", "specials", "about", "contact"].map((id) => document.getElementById(id));
    const navLinks = document.querySelectorAll(".nav-link");

    function onScroll() {
      header.classList.toggle("scrolled", window.scrollY > 40);

      let current = sections[0];
      sections.forEach((sec) => {
        if (sec && window.scrollY >= sec.offsetTop - 140) current = sec;
      });
      navLinks.forEach((link) => {
        link.classList.toggle("active", current && link.getAttribute("href") === `#${current.id}`);
      });

      document.getElementById("back-to-top").classList.toggle("visible", window.scrollY > 500);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Back to top ---------------- */
  function initBackToTop() {
    document.getElementById("back-to-top").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- Reveal-on-scroll animations ---------------- */
  function initRevealAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  /* ---------------- Page loader ---------------- */
  function initLoader() {
    window.addEventListener("load", () => {
      const loader = document.getElementById("page-loader");
      setTimeout(() => loader.classList.add("hidden"), 400);
    });
  }

  /* ---------------- Footer year ---------------- */
  function initFooterYear() {
    document.getElementById("year").textContent = new Date().getFullYear();
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderCategoryFilters();
    renderFooterCategories();
    renderSpecials();
    renderMenuGrid();
    syncCartUI();

    initCartDrawer();
    initSearch();
    initMobileNav();
    initHeaderScroll();
    initBackToTop();
    initRevealAnimations();
    initFooterYear();
  });

  initLoader();
})();
