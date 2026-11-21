
/* ==========================================
   FLORIDA STATE ROLEPLAY SHOP
   Complete Website Script
========================================== */

// ADMIN ACCESS
// Demo only: this password is publicly visible in GitHub.
const ADMIN_PASSWORD = "Sil01Kia";

// DISCORD
const DISCORD_INVITE = "fsrpnw";
const DISCORD_URL = "https://discord.gg/fsrpnw";

// DEFAULT PRODUCTS
const defaultProducts = [
  {id:"donation-2",name:"Small Donation",description:"Support Florida State Roleplay!",price:2,emoji:"💵",category:"donations",featured:true},
  {id:"donation-5",name:"Supporter Donation",description:"Show your support for our community.",price:5,emoji:"💚",category:"donations"},
  {id:"donation-10",name:"Big Supporter",description:"Make a bigger contribution!",price:10,emoji:"💎",category:"donations"},
  {id:"donation-20",name:"Major Donation",description:"A generous contribution to our server.",price:20,emoji:"🌴",category:"donations"},
  {id:"donation-50",name:"Legendary Donation",description:"Become a legendary supporter!",price:50,emoji:"👑",category:"donations"},
  {id:"special-supporter",name:"Special Supporter",description:"Receive the Special Supporter role.",price:10,emoji:"⭐",category:"special",featured:true},
  {id:"elite-supporter",name:"Elite Supporter",description:"Receive the Elite Supporter role.",price:20,emoji:"🏆",category:"special"},
  {id:"bronze",name:"Bronze Membership",description:"Bronze membership benefits.",price:5,emoji:"🥉",category:"memberships"},
  {id:"silver",name:"Silver Membership",description:"Silver membership benefits.",price:10,emoji:"🥈",category:"memberships"},
  {id:"gold",name:"Gold Membership",description:"Gold membership benefits.",price:20,emoji:"🥇",category:"memberships",featured:true}
];

// HELPERS
const $ = id => document.getElementById(id);

function read(key, fallback) {
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
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[c]);
}

function money(value) {
  return "$" + Number(value).toFixed(2);
}

// DATA
let products = read("fsr_products", defaultProducts);
let cart = read("fsr_cart", {});
let orders = read("fsr_orders", []);
let reviews = read("fsr_reviews", []);

let currentCategory = "all";
let discount = 0;
let adminLoggedIn = false;

// ==========================================
// PRODUCTS
// ==========================================

function renderProducts() {
  const query = $("searchInput").value.toLowerCase();

  const filtered = products.filter(p =>
    (currentCategory === "all" ||
      p.category === currentCategory) &&
    (p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query))
  );

  $("products").innerHTML = filtered.length
    ? filtered.map(productCard).join("")
    : "<p>No products found.</p>";

  $("featuredProducts").innerHTML = products
    .filter(p => p.featured)
    .map(productCard)
    .join("");

  document.querySelectorAll(".add-cart").forEach(button => {
    button.addEventListener("click", () =>
      addToCart(button.dataset.id)
    );
  });
}

function productCard(p) {
  return `
    <article class="product">
      ${p.featured
        ? '<span class="featured-label">★ FEATURED</span>'
        : ""}
      <div class="emoji">${safe(p.emoji || "🌴")}</div>
      <h3>${safe(p.name)}</h3>
      <p>${safe(p.description)}</p>
      <div class="price">${money(p.price)}</div>
      <button class="primary-btn add-cart"
        data-id="${safe(p.id)}">
        Add to Cart
      </button>
    </article>
  `;
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.category;

    document.querySelectorAll(".filter").forEach(b =>
      b.classList.remove("active")
    );

    button.classList.add("active");
    renderProducts();
  });
});

$("searchInput").addEventListener("input", renderProducts);

// ==========================================
// SHOPPING CART
// ==========================================

function addToCart(id) {
  if (!products.some(p => p.id === id)) return;

  cart[id] = (cart[id] || 0) + 1;

  save("fsr_cart", cart);
  renderCart();
  openCart();
}

function calculateTotal() {
  const subtotal = Object.entries(cart).reduce(
    (sum, [id, qty]) => {
      const product = products.find(p => p.id === id);

      return sum +
        (product ? Number(product.price) * qty : 0);
    }, 0
  );

  return {
    subtotal,
    total: Math.max(0, subtotal * (1 - discount))
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
              <button data-remove="${safe(id)}">
                Remove
              </button>
            </div>
            <div>
              <button data-change="${safe(id)}"
                data-amount="-1">−</button>
              ${qty}
              <button data-change="${safe(id)}"
                data-amount="1">+</button>
            </div>
          </div>
        `;
      }).join("")
    : "<p>Your cart is empty.</p>";

  document.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      delete cart[button.dataset.remove];
      save("fsr_cart", cart);
      renderCart();
    });
  });

  document.querySelectorAll("[data-change]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.change;

      cart[id] = (cart[id] || 0) +
        Number(button.dataset.amount);

      if (cart[id] <= 0) delete cart[id];

      save("fsr_cart", cart);
      renderCart();
    });
  });

  $("cartTotal").textContent =
    money(calculateTotal().total);
}

function openCart() {
  $("cartPanel").classList.add("open");
  $("cartBackdrop").classList.add("show");
}

function closeCart() {
  $("cartPanel").classList.remove("open");
  $("cartBackdrop").classList.remove("show");
}

$("cartToggle").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("cartBackdrop").addEventListener("click", closeCart);

// ==========================================
// DISCOUNT CODES
// ==========================================

$("applyDiscount").addEventListener("click", () => {
  const code = $("discountInput").value
    .trim()
    .toUpperCase();

  discount = code === "FSR10" ? 0.10 : 0;

  $("discountMessage").textContent = discount
    ? "10% discount applied!"
    : "Invalid discount code.";

  renderCart();
});

// ==========================================
// CHECKOUT
// ==========================================

$("checkoutBtn").addEventListener("click", async () => {
  const entries = Object.entries(cart).filter(([id, qty]) =>
    products.some(p => p.id === id) && qty > 0
  );

  if (!entries.length) {
    alert("Your cart is empty!");
    return;
  }

  const orderId =
    "FSR-" + Date.now().toString().slice(-8);

  const items = entries.map(([id, qty]) => {
    const p = products.find(item => item.id === id);
    return `${p.name} x${qty} - ${money(p.price * qty)}`;
  });

  const summary = [
    `Florida State Roleplay Order: ${orderId}`,
    ...items,
    `Total: ${money(calculateTotal().total)}`,
    "Please help me complete this order."
  ].join("\n");

  // Open Discord directly from the button click.
  window.open(DISCORD_URL, "_blank", "noopener");

  orders.unshift({
    id: orderId,
    date: new Date().toLocaleString(),
    items,
    total: calculateTotal().total,
    status: "Pending Discord confirmation"
  });

  save("fsr_orders", orders);

  cart = {};
  discount = 0;

  save("fsr_cart", cart);

  renderCart();
  renderOrders();
  closeCart();

  try {
    await navigator.clipboard.writeText(summary);
    alert("Order copied! Paste it into Discord.");
  } catch {
    alert("Order saved locally. Contact our Discord staff.");
  }
});

// ==========================================
// DISCORD STATISTICS
// ==========================================

async function loadDiscordStats() {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`,
      {cache: "no-store"}
    );

    if (!response.ok) throw new Error("Unavailable");

    const data = await response.json();

    $("totalMembers").textContent =
      Number(data.approximate_member_count || 0)
        .toLocaleString();

    $("onlineMembers").textContent =
      Number(data.approximate_presence_count || 0)
        .toLocaleString();

    $("serverStatus").textContent = "Online";

  } catch {
    $("totalMembers").textContent = "Unavailable";
    $("onlineMembers").textContent = "Unavailable";
    $("serverStatus").textContent = "Unavailable";
  }
}

loadDiscordStats();
setInterval(loadDiscordStats, 300000);

// ==========================================
// CUSTOMER REVIEWS
// ==========================================

function renderReviews() {
  $("reviewsList").innerHTML = reviews.length
    ? reviews.map(review => `
        <article class="review-card">
          <strong>${safe(review.name)}</strong>
          <div class="stars">
            ${"★".repeat(review.rating)}
            ${"☆".repeat(5 - review.rating)}
          </div>
          <p>${safe(review.text)}</p>
          <small>${safe(review.date)}</small>
        </article>
      `).join("")
    : "<p>No reviews yet. Be the first!</p>";
}

$("reviewForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("reviewName").value.trim();
  const text = $("reviewText").value.trim();
  const rating = Number($("reviewRating").value);

  if (!name || !text || rating < 1 || rating > 5) {
    alert("Please complete the review.");
    return;
  }

  reviews.unshift({
    name,
    text,
    rating,
    date: new Date().toLocaleDateString()
  });

  save("fsr_reviews", reviews);

  $("reviewForm").reset();

  renderReviews();
  updateAdmin();

  alert("Review saved successfully!");
});

// ==========================================
// ORDER HISTORY
// ==========================================

function renderOrders() {
  $("orderHistory").innerHTML = orders.length
    ? orders.map(order => `
        <article class="order-card">
          <strong>${safe(order.id)}</strong>
          <p>${safe(order.date)}</p>
          <p>${order.items.map(safe).join("<br>")}</p>
          <p>Total: ${money(order.total)}</p>
          <small>${safe(order.status)}</small>
        </article>
      `).join("")
    : "<p>No orders yet.</p>";
}

// ==========================================
// ADMIN PANEL
// ==========================================

$("adminLoginForm").addEventListener("submit", event => {
  event.preventDefault();

  const enteredCode = $("adminPassword").value;

  if (enteredCode === ADMIN_PASSWORD) {
    adminLoggedIn = true;

    $("adminLoginForm").hidden = true;
    $("adminDashboard").hidden = false;
    $("adminLoginMessage").textContent = "";

    updateAdmin();

    $("adminDashboard").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } else {
    $("adminLoginMessage").textContent =
      "Incorrect access code. Try again.";

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

// ADD PRODUCTS

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!adminLoggedIn) {
    alert("Admin access required!");
    return;
  }

  const product = {
    id: "custom-" + Date.now(),
    name: $("newName").value.trim(),
    price: Number($("newPrice").value),
    emoji: $("newEmoji").value.trim() || "🌴",
    category: $("newCategory").value,
    description: $("newDescription").value.trim()
  };

  if (
    !product.name ||
    !product.description ||
    !Number.isFinite(product.price) ||
    product.price < 0
  ) {
    alert("Please enter valid product details.");
    return;
  }

  products.push(product);

  save("fsr_products", products);

  $("productForm").reset();

  renderProducts();
  updateAdmin();

  alert("Product added successfully!");
});

// ADMIN COUNTERS

function updateAdmin() {
  $("adminProducts").textContent = products.length;
  $("adminOrders").textContent = orders.length;
  $("adminReviews").textContent = reviews.length;
}

// ==========================================
// INITIALIZE WEBSITE
// ==========================================

renderProducts();
renderCart();
renderReviews();
renderOrders();
updateAdmin();
