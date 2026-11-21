
/* =========================================
   FLORIDA STATE ROLEPLAY SHOP
   Complete Replacement Script
========================================= */

const ADMIN_PASSWORD = "Sil01Kia";
const DISCORD_INVITE = "fsrpnw";
const DISCORD_URL = "https://discord.gg/fsrpnw";

// DEFAULT PRODUCTS
const defaultProducts = [
  {id:"donation-2",name:"Small Donation",description:"Support Florida State Roleplay!",price:2,emoji:"💵",category:"donations",featured:true},
  {id:"donation-5",name:"Supporter Donation",description:"Show your support!",price:5,emoji:"💚",category:"donations"},
  {id:"donation-10",name:"Big Supporter",description:"Make a bigger contribution!",price:10,emoji:"💎",category:"donations"},
  {id:"donation-20",name:"Major Donation",description:"A generous contribution.",price:20,emoji:"🌴",category:"donations"},
  {id:"donation-50",name:"Legendary Donation",description:"Become a legendary supporter!",price:50,emoji:"👑",category:"donations"},
  {id:"special-supporter",name:"Special Supporter",description:"Special supporter benefits.",price:10,emoji:"⭐",category:"special",featured:true},
  {id:"elite-supporter",name:"Elite Supporter",description:"Elite supporter benefits.",price:20,emoji:"🏆",category:"special"},
  {id:"bronze",name:"Bronze Membership",description:"Bronze membership benefits.",price:5,emoji:"🥉",category:"memberships"},
  {id:"silver",name:"Silver Membership",description:"Silver membership benefits.",price:10,emoji:"🥈",category:"memberships"},
  {id:"gold",name:"Gold Membership",description:"Gold membership benefits.",price:20,emoji:"🥇",category:"memberships",featured:true}
];

// STORAGE
function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safe(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

function money(value) {
  return "$" + Number(value).toFixed(2);
}

// DATA
let products = load("fsr_products", defaultProducts);
let cart = load("fsr_cart", {});
let orders = load("fsr_orders", []);
let reviews = load("fsr_reviews", []);

let category = "all";
let discount = 0;
let adminLoggedIn = false;

// ELEMENT HELPER
const $ = id => document.getElementById(id);

// =========================================
// PUBLIC SHOP - NO LOGIN REQUIRED
// =========================================

function renderProducts() {
  const search = $("searchInput").value.toLowerCase();

  const filtered = products.filter(product => {
    const matchesCategory =
      category === "all" || product.category === category;

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  $("products").innerHTML = filtered.length
    ? filtered.map(productCard).join("")
    : "<p>No products found.</p>";

  $("featuredProducts").innerHTML = products
    .filter(product => product.featured)
    .map(productCard)
    .join("");

  document.querySelectorAll(".add-cart").forEach(button => {
    button.addEventListener("click", () => addToCart(button.dataset.id));
  });
}

function productCard(product) {
  return `
    <article class="product">
      ${product.featured ? '<span class="featured-label">★ FEATURED</span>' : ""}
      <div class="emoji">${safe(product.emoji || "🌴")}</div>
      <h3>${safe(product.name)}</h3>
      <p>${safe(product.description)}</p>
      <div class="price">${money(product.price)}</div>
      <button class="primary-btn add-cart" data-id="${safe(product.id)}">
        Add to Cart
      </button>
    </article>
  `;
}

// CATEGORY FILTERS
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.category;

    document.querySelectorAll(".filter").forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");
    renderProducts();
  });
});

// SEARCH
$("searchInput").addEventListener("input", renderProducts);

// =========================================
// CART
// =========================================

function addToCart(id) {
  if (!products.some(product => product.id === id)) return;

  cart[id] = (cart[id] || 0) + 1;
  store("fsr_cart", cart);

  renderCart();
  openCart();
}

function getTotals() {
  const subtotal = Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = products.find(item => item.id === id);
    return sum + (product ? product.price * quantity : 0);
  }, 0);

  return {
    subtotal,
    total: Math.max(0, subtotal * (1 - discount))
  };
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id, quantity]) =>
    products.some(product => product.id === id) && quantity > 0
  );

  $("cartCount").textContent = entries.reduce(
    (sum, [, quantity]) => sum + quantity, 0
  );

  $("cartItems").innerHTML = entries.length
    ? entries.map(([id, quantity]) => {
        const product = products.find(item => item.id === id);

        return `
          <div class="cart-item">
            <div>
              <strong>${safe(product.name)}</strong>
              <p>${money(product.price)} × ${quantity}</p>
              <button data-remove="${safe(id)}">Remove</button>
            </div>
            <div>
              <button data-change="${safe(id)}" data-amount="-1">−</button>
              ${quantity}
              <button data-change="${safe(id)}" data-amount="1">+</button>
            </div>
          </div>
        `;
      }).join("")
    : "<p>Your cart is empty.</p>";

  document.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      delete cart[button.dataset.remove];
      store("fsr_cart", cart);
      renderCart();
    });
  });

  document.querySelectorAll("[data-change]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.change;
      cart[id] = (cart[id] || 0) + Number(button.dataset.amount);

      if (cart[id] <= 0) delete cart[id];

      store("fsr_cart", cart);
      renderCart();
    });
  });

  $("cartTotal").textContent = money(getTotals().total);
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

// =========================================
// DISCOUNT CODE
// =========================================

$("applyDiscount").addEventListener("click", () => {
  const code = $("discountInput").value.trim().toUpperCase();

  discount = code === "FSR10" ? 0.10 : 0;

  $("discountMessage").textContent = discount
    ? "10% discount applied!"
    : "Invalid discount code.";

  renderCart();
});

// =========================================
// CHECKOUT
// =========================================

$("checkoutBtn").addEventListener("click", async () => {
  const entries = Object.entries(cart).filter(([id, quantity]) =>
    products.some(product => product.id === id) && quantity > 0
  );

  if (!entries.length) {
    alert("Your cart is empty!");
    return;
  }

  const orderId = "FSR-" + Date.now().toString().slice(-8);

  const items = entries.map(([id, quantity]) => {
    const product = products.find(item => item.id === id);
    return `${product.name} x${quantity} - ${money(product.price * quantity)}`;
  });

  const summary = [
    `Florida State Roleplay Order: ${orderId}`,
    ...items,
    `Total: ${money(getTotals().total)}`,
    "Please help me complete this order."
  ].join("\n");

  orders.unshift({
    id: orderId,
    date: new Date().toLocaleString(),
    items,
    total: getTotals().total,
    status: "Pending Discord confirmation"
  });

  store("fsr_orders", orders);

  cart = {};
  discount = 0;
  store("fsr_cart", cart);

  renderCart();
  renderOrders();
  closeCart();

  window.open(DISCORD_URL, "_blank", "noopener");

  try {
    await navigator.clipboard.writeText(summary);
    alert("Your order was copied! Paste it into Discord.");
  } catch {
    alert("Your order was saved on this device. Contact our Discord staff.");
  }
});

// =========================================
// DISCORD MEMBER COUNTS
// =========================================

async function loadDiscordStats() {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`,
      {cache:"no-store"}
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

// =========================================
// REVIEWS
// =========================================

function renderReviews() {
  $("reviewsList").innerHTML = reviews.length
    ? reviews.map(review => `
        <article class="review-card">
          <strong>${safe(review.name)}</strong>
          <div class="stars">
            ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}
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
    alert("Please complete your review.");
    return;
  }

  reviews.unshift({
    name,
    text,
    rating,
    date: new Date().toLocaleDateString()
  });

  store("fsr_reviews", reviews);
  $("reviewForm").reset();

  renderReviews();
  updateAdmin();

  alert("Review saved!");
});

// =========================================
// ORDER HISTORY
// =========================================

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

// =========================================
// ADMIN ACCESS
// THE SHOP DOES NOT REQUIRE THIS CODE
// =========================================

// Only this form asks for the admin code.
$("adminLoginForm").addEventListener("submit", event => {
  event.preventDefault();

  const code = $("adminPassword").value;

  if (code === ADMIN_PASSWORD) {
    adminLoggedIn = true;

    $("adminLoginForm").hidden = true;
    $("adminDashboard").hidden = false;
    $("adminLoginMessage").textContent = "";

    updateAdmin();

    $("adminDashboard").scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  } else {
    $("adminLoginMessage").textContent =
      "Incorrect admin code. Please try again.";

    $("adminPassword").value = "";
  }
});

// LOGOUT
$("adminLogout").addEventListener("click", () => {
  adminLoggedIn = false;

  $("adminDashboard").hidden = true;
  $("adminLoginForm").hidden = false;
  $("adminPassword").value = "";

  $("adminLoginMessage").textContent = "You have logged out.";
});

// ADD PRODUCT
$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!adminLoggedIn) {
    alert("Admin access required!");
    return;
  }

  const product = {
    id:"custom-" + Date.now(),
    name:$("newName").value.trim(),
    price:Number($("newPrice").value),
    emoji:$("newEmoji").value.trim() || "🌴",
    category:$("newCategory").value,
    description:$("newDescription").value.trim()
  };

  if (
    !product.name ||
    !product.description ||
    !Number.isFinite(product.price) ||
    product.price < 0
  ) {
    alert("Please enter valid product information.");
    return;
  }

  products.push(product);
  store("fsr_products", products);

  $("productForm").reset();

  renderProducts();
  updateAdmin();

  alert("Product added!");
});

// ADMIN COUNTERS
function updateAdmin() {
  $("adminProducts").textContent = products.length;
  $("adminOrders").textContent = orders.length;
  $("adminReviews").textContent = reviews.length;
}

// =========================================
// START WEBSITE
// =========================================

// This runs immediately for EVERY visitor.
// No password or login is needed to browse.
renderProducts();
renderCart();
renderReviews();
renderOrders();
updateAdmin();
