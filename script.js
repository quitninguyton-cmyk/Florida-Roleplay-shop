
(() => {
  "use strict";

  const DISCORD_INVITE = "https://discord.gg/fsrpnw";

  // DEMO ONLY: This password is visible in the public JavaScript source.
  // It is not secure protection for sensitive admin actions.
  const DEMO_ADMIN_PASSWORD = "Sil01Kia";

  const $ = (id) => document.getElementById(id);
  const STORE = "fsr_shop_v2";
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const defaults = {
    products: clone(window.FSR_DEFAULT_PRODUCTS || []),
    cart: [],
    orders: [],
    reviews: [],
    wishlist: [],
    points: 0,
    announcements: [
      {
        title: "Welcome to Florida State Roleplay!",
        body: "Thanks for visiting our community shop."
      }
    ],
    leaderboard: [
      { name: "Community Supporter", amount: 25 },
      { name: "Florida Fan", amount: 10 }
    ],
    event: {
      title: "Florida community event coming soon!",
      date: "",
      description: "Check Discord for event announcements."
    },
    stock: {},
    discount: "",
    giftCards: [],
    referralCode: "FSR-" + Math.random().toString(36).slice(2, 8).toUpperCase()
  };

  let data;

  try {
    data = {
      ...defaults,
      ...JSON.parse(localStorage.getItem(STORE) || "{}")
    };
  } catch {
    data = clone(defaults);
  }

  let activeCategory = "all";

  const money = n => "$" + Number(n || 0).toFixed(2);

  const save = () => {
    localStorage.setItem(STORE, JSON.stringify(data));
  };

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  let toastTimer;

  function toast(message) {
    const el = $("toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove("show");
    }, 2300);
  }

  function productById(id) {
    return data.products.find(p => p.id === id);
  }

  function renderProducts() {
    const query = ($("searchInput").value || "").toLowerCase();

    const list = data.products.filter(p =>
      (activeCategory === "all" || p.category === activeCategory) &&
      (p.name + " " + p.description).toLowerCase().includes(query)
    );

    $("products").innerHTML = list.length
      ? list.map(p => `
        <article class="product-card">
          <div class="product-emoji">${escapeHTML(p.emoji || "🌴")}</div>
          <h3>${escapeHTML(p.name)}</h3>
          <p>${escapeHTML(p.description || "")}</p>

          <div class="product-bottom">
            <strong class="price">${money(p.price)}</strong>
            <small class="muted">
              ${Number(p.stock ?? 99) > 0 ? "Available" : "Out of stock"}
            </small>
          </div>

          <div class="product-actions">
            <button class="button primary small"
              data-add="${escapeHTML(p.id)}"
              ${Number(p.stock ?? 99) <= 0 ? "disabled" : ""}>
              Add to cart
            </button>

            <button class="button ghost small" data-wish="${escapeHTML(p.id)}">
              ${data.wishlist.includes(p.id) ? "♥ Saved" : "♡ Save"}
            </button>
          </div>
        </article>
      `).join("")
      : '<p class="muted">No products match your search.</p>';

    $("totalProducts").textContent = data.products.length;
  }

  function cartTotal() {
    const subtotal = data.cart.reduce((sum, item) => {
      return sum + (productById(item.id)?.price || 0) * item.qty;
    }, 0);

    return Math.max(0, subtotal * (data.discount === "FSR10" ? 0.9 : 1));
  }

  function renderCart() {
    const count = data.cart.reduce((n, x) => n + x.qty, 0);

    $("cartCount").textContent = count;
    $("cartStat").textContent = count;

    $("cartItems").innerHTML = data.cart.length
      ? data.cart.map(item => {
          const p = productById(item.id);
          if (!p) return "";

          return `
            <div class="cart-item">
              <div>
                <b>${escapeHTML(p.name)}</b><br>
                <small>${money(p.price)} each</small><br>
                <button class="filter" data-remove="${escapeHTML(p.id)}">
                  Remove
                </button>
              </div>

              <div>
                <button class="filter" data-qty="${escapeHTML(p.id)}" data-change="-1">−</button>
                ${item.qty}
                <button class="filter" data-qty="${escapeHTML(p.id)}" data-change="1">+</button>
              </div>
            </div>
          `;
        }).join("")
      : '<p class="muted">Your cart is empty.</p>';

    $("cartTotal").textContent = money(cartTotal());
  }

  function renderWishlist() {
    const items = data.wishlist.map(productById).filter(Boolean);

    $("wishlistItems").innerHTML = items.length
      ? items.map(p => `
        <div class="list-row">
          ${escapeHTML(p.emoji)} ${escapeHTML(p.name)}
          <button class="filter" data-wish="${escapeHTML(p.id)}">Remove</button>
        </div>
      `).join("")
      : "Your saved products will appear here.";
  }

  function renderOrders() {
    $("orderHistory").innerHTML = data.orders.length
      ? data.orders.slice().reverse().map(o => `
        <div class="list-row">
          <b>${escapeHTML(o.id)}</b> · ${money(o.total)}<br>
          <small>${escapeHTML(o.date)} · ${escapeHTML(o.status)}</small>
        </div>
      `).join("")
      : "No saved orders yet.";
  }

  function renderReviews() {
    $("reviewsList").innerHTML = data.reviews.length
      ? data.reviews.slice().reverse().map(r => `
        <article class="review-item">
          <b>${escapeHTML(r.name)}</b>
          <span class="price">${"★".repeat(r.rating)}</span>
          <p>${escapeHTML(r.text)}</p>
          <small class="muted">${escapeHTML(r.date)}</small>
        </article>
      `).join("")
      : '<p class="muted">No local reviews yet.</p>';
  }

  function renderCommunity() {
    $("loyaltyPoints").textContent = data.points;

    $("announcements").innerHTML = data.announcements.map(a => `
      <div class="list-row">
        <b>${escapeHTML(a.title)}</b><br>
        <span class="muted">${escapeHTML(a.body)}</span>
      </div>
    `).join("") || "No announcements.";

    $("leaderboard").innerHTML = data.leaderboard
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .map(x => `
        <li>
          ${escapeHTML(x.name)}
          <span class="muted">— ${money(x.amount)} (display only)</span>
        </li>
      `).join("");

    $("seasonalEvent").innerHTML = `
      <b>${escapeHTML(data.event.title)}</b>
      <p class="muted">${escapeHTML(data.event.description || "")}</p>
      ${data.event.date ? `<small>${escapeHTML(data.event.date)}</small>` : ""}
    `;

    $("referralCode").textContent = data.referralCode;
  }

  function renderStockEditor() {
    $("stockEditor").innerHTML = data.products.map(p => `
      <label class="stock-row">
        <span>${escapeHTML(p.name)}</span>
        <input type="number" min="0"
          data-stock="${escapeHTML(p.id)}"
          value="${Number(p.stock ?? 99)}">
      </label>
    `).join("");
  }

  function renderAll() {
    renderProducts();
    renderCart();
    renderWishlist();
    renderOrders();
    renderReviews();
    renderCommunity();
    renderStockEditor();
    save();
  }

  $("searchInput").addEventListener("input", renderProducts);

  document.querySelectorAll("[data-category]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.category;

      document.querySelectorAll(".filter[data-category]").forEach(b => {
        b.classList.toggle("active", b === btn);
      });

      renderProducts();
    });
  });

  $("products").addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    const wish = e.target.closest("[data-wish]");

    if (add) {
      const p = productById(add.dataset.add);

      if (!p || Number(p.stock ?? 99) <= 0) return;

      const row = data.cart.find(x => x.id === p.id);

      if (row) row.qty++;
      else data.cart.push({ id: p.id, qty: 1 });

      renderCart();
      save();
      toast("Added to cart!");
    }

    if (wish) toggleWish(wish.dataset.wish);
  });

  function toggleWish(id) {
    data.wishlist = data.wishlist.includes(id)
      ? data.wishlist.filter(x => x !== id)
      : [...data.wishlist, id];

    renderWishlist();
    renderProducts();
    save();
  }

  $("wishlistItems").addEventListener("click", e => {
    const b = e.target.closest("[data-wish]");
    if (b) toggleWish(b.dataset.wish);
  });

  $("cartItems").addEventListener("click", e => {
    const rem = e.target.closest("[data-remove]");
    const q = e.target.closest("[data-qty]");

    if (rem) {
      data.cart = data.cart.filter(x => x.id !== rem.dataset.remove);
    }

    if (q) {
      const item = data.cart.find(x => x.id === q.dataset.qty);

      if (item) {
        item.qty += Number(q.dataset.change);

        if (item.qty <= 0) {
          data.cart = data.cart.filter(x => x !== item);
        }
      }
    }

    renderCart();
    save();
  });

  $("cartToggle").addEventListener("click", () => {
    $("cartPanel").hidden = false;
  });

  $("closeCart").addEventListener("click", () => {
    $("cartPanel").hidden = true;
  });

  $("applyDiscount").addEventListener("click", () => {
    const code = $("discountInput").value.trim().toUpperCase();

    data.discount = code === "FSR10" ? "FSR10" : "";

    $("discountMessage").textContent = data.discount
      ? "FSR10 applied — 10% demo discount."
      : "Invalid demo code. Try FSR10.";

    renderCart();
    save();
  });

  $("checkoutBtn").addEventListener("click", () => {
    if (!data.cart.length) {
      toast("Your cart is empty.");
      return;
    }

    const order = {
      id: "FSR-" + Date.now().toString().slice(-8),
      date: new Date().toLocaleString(),
      status: "Request created — awaiting staff confirmation",
      total: cartTotal(),
      items: data.cart.map(x => ({
        name: productById(x.id)?.name,
        qty: x.qty
      }))
    };

    data.orders.push(order);
    data.cart = [];
    data.discount = "";

    save();
    renderCart();
    renderOrders();

    const body = `Hello Florida State Roleplay staff! I'd like to request this order:
Order: ${order.id}
${order.items.map(x => `${x.qty} x ${x.name}`).join("\n")}
Estimated total: ${money(order.total)}
Please tell me how to proceed.`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body).catch(() => {});
    }

    window.open(DISCORD_INVITE, "_blank", "noopener");

    toast("Order request saved. Message copied if browser allowed it.");
    $("cartPanel").hidden = true;
  });

  $("demoPoints").addEventListener("click", () => {
    data.points += 10;
    renderCommunity();
    save();
    toast("10 demo points added.");
  });

  $("reviewForm").addEventListener("submit", e => {
    e.preventDefault();

    data.reviews.push({
      name: $("reviewName").value.trim(),
      rating: Number($("reviewRating").value),
      text: $("reviewText").value.trim(),
      date: new Date().toLocaleDateString()
    });

    $("reviewForm").reset();
    renderReviews();
    save();
    toast("Review saved in this browser.");
  });

  $("ticketForm").addEventListener("submit", e => {
    e.preventDefault();

    const msg = `Support request from ${$("ticketName").value}
Topic: ${$("ticketTopic").value}
${$("ticketMessage").value}`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).catch(() => {});
    }

    window.open(DISCORD_INVITE, "_blank", "noopener");
    toast("Support message copied if allowed. Send it in Discord.");
  });

  $("copyReferral").addEventListener("click", () => {
    if (!navigator.clipboard?.writeText) {
      toast("Copy is unavailable in this browser.");
      return;
    }

    navigator.clipboard.writeText($("referralCode").textContent)
      .then(() => toast("Referral code copied!"))
      .catch(() => toast("Copy is unavailable in this browser."));
  });

  $("printLatest").addEventListener("click", () => {
    const o = data.orders[data.orders.length - 1];

    if (!o) {
      toast("No order receipts yet.");
      return;
    }

    const w = window.open("", "_blank");

    if (!w) {
      toast("Allow pop-ups to print.");
      return;
    }

    w.document.write(`
      <title>Receipt ${escapeHTML(o.id)}</title>
      <h1>Florida State Roleplay — Order Request</h1>
      <p>${escapeHTML(o.id)}</p>
      <p>${escapeHTML(o.date)}</p>
      <ul>
        ${o.items.map(i => `
          <li>${i.qty} × ${escapeHTML(i.name)}</li>
        `).join("")}
      </ul>
      <h2>${money(o.total)}</h2>
      <p>Request only — payment has not been verified.</p>
    `);

    w.document.close();
    w.print();
  });

  $("adminLoginForm").addEventListener("submit", e => {
    e.preventDefault();

    if ($("adminPassword").value === DEMO_ADMIN_PASSWORD) {
      $("adminDashboard").hidden = false;
      $("adminLoginMessage").textContent =
        "Demo admin tools unlocked on this device.";

      renderStockEditor();
    } else {
      $("adminLoginMessage").textContent =
        "That demo password is incorrect.";
    }
  });

  $("adminLogout").addEventListener("click", () => {
    $("adminDashboard").hidden = true;
    $("adminPassword").value = "";
  });

  $("productForm").addEventListener("submit", e => {
    e.preventDefault();

    const p = {
      id: "custom-" + Date.now(),
      name: $("newName").value.trim(),
      price: Number($("newPrice").value),
      emoji: $("newEmoji").value.trim() || "🌴",
      category: $("newCategory").value,
      description: $("newDescription").value.trim(),
      stock: 99
    };

    data.products.push(p);

    $("productForm").reset();
    renderAll();
    toast("Product added locally.");
  });

  $("announcementForm").addEventListener("submit", e => {
    e.preventDefault();

    data.announcements.unshift({
      title: $("announcementTitle").value.trim(),
      body: $("announcementBody").value.trim()
    });

    $("announcementForm").reset();
    renderCommunity();
    save();
    toast("Announcement saved locally.");
  });

  $("leaderboardForm").addEventListener("submit", e => {
    e.preventDefault();

    data.leaderboard.push({
      name: $("supporterName").value.trim(),
      amount: Number($("supporterAmount").value)
    });

    $("leaderboardForm").reset();
    renderCommunity();
    save();
    toast("Leaderboard updated locally.");
  });

  $("eventForm").addEventListener("submit", e => {
    e.preventDefault();

    data.event = {
      title: $("eventTitle").value.trim(),
      date: $("eventDate").value,
      description: $("eventDescription").value.trim()
    };

    renderCommunity();
    save();
    toast("Event saved locally.");
  });

  $("stockEditor").addEventListener("change", e => {
    const id = e.target.dataset.stock;
    if (!id) return;

    const p = productById(id);

    if (p) {
      p.stock = Math.max(0, Number(e.target.value));
      renderProducts();
      save();
    }
  });

  $("createGift").addEventListener("click", () => {
    const amount = Number($("giftAmount").value);

    if (amount <= 0) {
      toast("Enter a gift amount first.");
      return;
    }

    const code = "FSRG-" +
      Math.random().toString(36).slice(2, 8).toUpperCase();

    data.giftCards.push({
      code,
      amount,
      remaining: amount
    });

    $("giftOutput").textContent =
      `Demo code: ${code} — ${money(amount)}. This code is not securely redeemable across customers.`;

    save();
  });

  $("exportData").addEventListener("click", () => {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fsr-shop-local-backup.json";
    a.click();

    URL.revokeObjectURL(a.href);
  });

  $("resetData").addEventListener("click", () => {
    if (confirm("Reset all Florida State Roleplay shop data saved in THIS browser?")) {
      localStorage.removeItem(STORE);
      location.reload();
    }
  });

  $("dailyDeal").innerHTML = `
    <b>🌴 FSR10 — 10% demo discount</b>
    <p class="muted">
      Enter FSR10 in the cart. Staff must confirm any real offer.
    </p>
  `;

  renderAll();
})();
