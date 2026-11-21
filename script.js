
(() => {
  "use strict";

  const ADMIN_PASSWORD = "Sil01Kia";
  const DISCORD_INVITE = "fsrpnw";
  const DISCORD_URL = "https://discord.gg/fsrpnw";

  const $ = id => document.getElementById(id);

  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function safe(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function money(value) {
    return "$" + Number(value).toFixed(2);
  }

  let products = load("fsr_products", window.FSR_PRODUCTS || []);
  let cart = load("fsr_cart", {});
  let orders = load("fsr_orders", []);
  let reviews = load("fsr_reviews", []);
  let category = "all";
  let discount = 0;
  let adminLoggedIn = false;

  // PRODUCTS
  function productCard(p) {
    return `
      <article class="product">
        ${p.featured ? '<span class="featured-label">★ FEATURED</span>' : ""}
        <div class="emoji">${safe(p.emoji || "🌴")}</div>
        <h3>${safe(p.name)}</h3>
        <p>${safe(p.description)}</p>
        <div class="price">${money(p.price)}</div>
        <button class="add-cart" data-id="${safe(p.id)}">Add to Cart</button>
      </article>
    `;
  }

  function renderProducts() {
    const query = $("searchInput").value.trim().toLowerCase();

    const filtered = products.filter(p =>
      (category === "all" || p.category === category) &&
      (p.name.toLowerCase().includes(query) ||
       p.description.toLowerCase().includes(query))
    );

    $("products").innerHTML = filtered.length
      ? filtered.map(productCard).join("")
      : "<p>No products found.</p>";

    $("featuredProducts").innerHTML = products
      .filter(p => p.featured)
      .map(productCard).join("");
  }

  $("products").addEventListener("click", e => {
    const button = e.target.closest(".add-cart");
    if (button) addToCart(button.dataset.id);
  });

  $("featuredProducts").addEventListener("click", e => {
    const button = e.target.closest(".add-cart");
    if (button) addToCart(button.dataset.id);
  });

  $("searchInput").addEventListener("input", renderProducts);

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      category = button.dataset.category;

      document.querySelectorAll(".filter").forEach(b =>
        b.classList.remove("active")
      );

      button.classList.add("active");
      renderProducts();
    });
  });

  // CART
  function addToCart(id) {
    if (!products.some(p => p.id === id)) return;

    cart[id] = (cart[id] || 0) + 1;
    save("fsr_cart", cart);
    renderCart();

    $("cartPanel").hidden = false;
    $("cartPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function totals() {
    const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find(item => item.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);

    return {
      subtotal,
      total: subtotal * (1 - discount)
    };
  }

  function renderCart() {
    const entries = Object.entries(cart).filter(([id, qty]) =>
      products.some(p => p.id === id) && qty > 0
    );

    $("cartCount").textContent = entries.reduce(
      (sum, [, qty]) => sum + qty, 0
    );

    $("cartItems").innerHTML = entries.length
      ? entries.map(([id, qty]) => {
          const p = products.find(item => item.id === id);

          return `
            <div class="cart-item">
              <div>
                <strong>${safe(p.name)}</strong>
                <p>${money(p.price)} × ${qty}</p>
              </div>
              <div>
                <button data-change="${safe(id)}" data-amount="-1">−</button>
                ${qty}
                <button data-change="${safe(id)}" data-amount="1">+</button>
                <button class="secondary" data-remove="${safe(id)}">Remove</button>
              </div>
            </div>
          `;
        }).join("")
      : "<p>Your cart is empty.</p>";

    $("cartTotal").textContent = money(totals().total);
  }

  $("cartItems").addEventListener("click", e => {
    const change = e.target.closest("[data-change]");
    const remove = e.target.closest("[data-remove]");

    if (remove) {
      delete cart[remove.dataset.remove];
    }

    if (change) {
      const id = change.dataset.change;
      cart[id] = (cart[id] || 0) + Number(change.dataset.amount);
      if (cart[id] <= 0) delete cart[id];
    }

    save("fsr_cart", cart);
    renderCart();
  });

  $("cartToggle").addEventListener("click", () => {
    $("cartPanel").hidden = !$("cartPanel").hidden;
  });

  $("closeCart").addEventListener("click", () => {
    $("cartPanel").hidden = true;
  });

  // DISCOUNT
  $("applyDiscount").addEventListener("click", () => {
    const code = $("discountInput").value.trim().toUpperCase();
    discount = code === "FSR10" ? 0.10 : 0;

    $("discountMessage").textContent = discount
      ? "10% discount applied!"
      : "Invalid discount code.";

    renderCart();
  });

  // CHECKOUT
  $("checkoutBtn").addEventListener("click", async () => {
    const entries = Object.entries(cart).filter(([id, qty]) =>
      products.some(p => p.id === id) && qty > 0
    );

    if (!entries.length) {
      alert("Your cart is empty!");
      return;
    }

    const orderId = "FSR-" + Date.now().toString().slice(-8);
    const items = entries.map(([id, qty]) => {
      const p = products.find(item => item.id === id);
      return `${p.name} x${qty} - ${money(p.price * qty)}`;
    });

    const summary = [
      `Florida State Roleplay Order ${orderId}`,
      ...items,
      `Total: ${money(totals().total)}`,
      "Please help me complete this order."
    ].join("\n");

    orders.unshift({
      id: orderId,
      date: new Date().toLocaleString(),
      items,
      total: totals().total,
      status: "Pending Discord confirmation"
    });

    save("fsr_orders", orders);
    cart = {};
    discount = 0;
    save("fsr_cart", cart);

    renderCart();
    renderOrders();
    $("cartPanel").hidden = true;

    try {
      await navigator.clipboard.writeText(summary);
      alert("Order copied! Paste it into Discord.");
    } catch {
      alert("Order saved on this device. Please contact staff on Discord.");
    }

    window.open(DISCORD_URL, "_blank", "noopener");
  });

  // DISCORD COUNTS
  async function loadDiscordStats() {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error("Discord unavailable");

      const data = await response.json();

      $("totalMembers").textContent =
        Number(data.approximate_member_count || 0).toLocaleString();

      $("onlineMembers").textContent =
        Number(data.approximate_presence_count || 0).toLocaleString();

      $("serverStatus").textContent = "Online";
    } catch {
      $("totalMembers").textContent = "Unavailable";
      $("onlineMembers").textContent = "Unavailable";
      $("serverStatus").textContent = "Unavailable";
    }
  }

  loadDiscordStats();
  setInterval(loadDiscordStats, 300000);

  // REVIEWS
  function renderReviews() {
    $("reviewsList").innerHTML = reviews.length
      ? reviews.map(r => `
          <article class="review-card">
            <strong>${safe(r.name)}</strong>
            <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
            <p>${safe(r.text)}</p>
            <small>${safe(r.date)}</small>
          </article>
        `).join("")
      : "<p>No reviews yet. Be the first!</p>";
  }

  $("reviewForm").addEventListener("submit", e => {
    e.preventDefault();

    const name = $("reviewName").value.trim();
    const text = $("reviewText").value.trim();
    const rating = Number($("reviewRating").value);

    if (!name || !text || rating < 1 || rating > 5) return;

    reviews.unshift({
      name, text, rating,
      date: new Date().toLocaleDateString()
    });

    save("fsr_reviews", reviews);
    $("reviewForm").reset();
    renderReviews();
    updateAdmin();
    alert("Review saved on this device!");
  });

  // ORDERS
  function renderOrders() {
    $("orderHistory").innerHTML = orders.length
      ? orders.map(o => `
          <article class="order-card">
            <strong>${safe(o.id)}</strong>
            <p>${safe(o.date)}</p>
            <p>${o.items.map(safe).join("<br>")}</p>
            <p>Total: ${money(o.total)}</p>
            <small>${safe(o.status)}</small>
          </article>
        `).join("")
      : "<p>No orders on this device yet.</p>";
  }

  // ADMIN ACCESS: ONLY THIS FORM REQUIRES THE CODE
  $("adminLoginForm").addEventListener("submit", e => {
    e.preventDefault();

    if ($("adminPassword").value === ADMIN_PASSWORD) {
      adminLoggedIn = true;
      $("adminLoginForm").hidden = true;
      $("adminDashboard").hidden = false;
      $("adminLoginMessage").textContent = "";
      updateAdmin();
    } else {
      $("adminLoginMessage").textContent = "Incorrect admin code.";
      $("adminPassword").value = "";
    }
  });

  $("adminLogout").addEventListener("click", () => {
    adminLoggedIn = false;
    $("adminDashboard").hidden = true;
    $("adminLoginForm").hidden = false;
    $("adminPassword").value = "";
    $("adminLoginMessage").textContent = "Logged out.";
  });

  $("productForm").addEventListener("submit", e => {
    e.preventDefault();

    if (!adminLoggedIn) return;

    const product = {
      id: "custom-" + Date.now(),
      name: $("newName").value.trim(),
      price: Number($("newPrice").value),
      emoji: $("newEmoji").value.trim() || "🌴",
      category: $("newCategory").value,
      description: $("newDescription").value.trim()
    };

    if (!product.name || !product.description ||
        !Number.isFinite(product.price) || product.price < 0) {
      alert("Please enter valid product details.");
      return;
    }

    products.push(product);
    save("fsr_products", products);
    $("productForm").reset();
    renderProducts();
    updateAdmin();
    alert("Product added!");
  });

  function updateAdmin() {
    $("adminProducts").textContent = products.length;
    $("adminOrders").textContent = orders.length;
    $("adminReviews").textContent = reviews.length;
  }

  // START THE PUBLIC SHOP. NO LOGIN CHECK HERE.
  renderProducts();
  renderCart();
  renderReviews();
  renderOrders();
  updateAdmin();
})();
