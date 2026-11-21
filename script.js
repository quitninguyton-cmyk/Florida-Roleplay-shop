
const DISCORD_INVITE = "fsrpnw";
const DISCORD_URL = "https://discord.gg/fsrpnw";

// DEMO ONLY: This password is public in GitHub source code.
const ADMIN_PASSWORD = "Sil01Kia";

const defaultProducts = [
  {id:"donation-2",name:"Small Donation",description:"Support our community.",price:2,emoji:"💵",category:"donations",featured:true},
  {id:"donation-5",name:"Supporter Donation",description:"Show your support.",price:5,emoji:"💚",category:"donations"},
  {id:"donation-10",name:"Big Supporter",description:"Make a bigger contribution.",price:10,emoji:"💎",category:"donations"},
  {id:"donation-20",name:"Major Donation",description:"A generous contribution.",price:20,emoji:"🌴",category:"donations"},
  {id:"donation-50",name:"Legendary Donation",description:"Become a legendary supporter.",price:50,emoji:"👑",category:"donations"},
  {id:"special-supporter",name:"Special Supporter",description:"Special Supporter role.",price:10,emoji:"⭐",category:"special",featured:true},
  {id:"elite-supporter",name:"Elite Supporter",description:"Elite Supporter role.",price:20,emoji:"🏆",category:"special"},
  {id:"bronze",name:"Bronze Membership",description:"Bronze membership benefits.",price:5,emoji:"🥉",category:"memberships"},
  {id:"silver",name:"Silver Membership",description:"Silver membership benefits.",price:10,emoji:"🥈",category:"memberships"},
  {id:"gold",name:"Gold Membership",description:"Gold membership benefits.",price:20,emoji:"🥇",category:"memberships",featured:true}
];

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
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  })[c]);
}

const money = n => "$" + Number(n).toFixed(2);

let products = read("fsr_products", defaultProducts);
let cart = read("fsr_cart", {});
let orders = read("fsr_orders", []);
let reviews = read("fsr_reviews", []);
let category = "all";
let discount = 0;

// PRODUCTS

function productCard(p) {
  return `
    <article class="product">
      ${p.featured ? '<span class="featured-label">★ FEATURED</span>' : ""}
      <div class="emoji">${safe(p.emoji || "🌴")}</div>
      <h3>${safe(p.name)}</h3>
      <p>${safe(p.description)}</p>
      <div class="price">${money(p.price)}</div>
      <button class="primary-btn add-cart" data-id="${safe(p.id)}">
        Add to Cart
      </button>
    </article>`;
}

function renderProducts() {
  const query = $("searchInput").value.toLowerCase();

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

  document.querySelectorAll(".add-cart").forEach(button => {
    button.addEventListener("click", () => addToCart(button.dataset.id));
  });
}

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

$("searchInput").addEventListener("input", renderProducts);

// SHOPPING CART

function addToCart(id) {
  if (!products.some(p => p.id === id)) return;

  cart[id] = (cart[id] || 0) + 1;
  save("fsr_cart", cart);
  renderCart();
  openCart();
}

function total() {
  const subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find(item => item.id === id);
    return sum + (p ? Number(p.price) * qty : 0);
  }, 0);

  return subtotal * (1 - discount);
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id]) =>
    products.some(p => p.id === id)
  );

  $("cartCount").textContent = entries.reduce((s, [,q]) => s + q, 0);

  $("cartItems").innerHTML = entries.length
    ? entries.map(([id, qty]) => {
        const p = products.find(item => item.id === id);

        return `
          <div class="cart-item">
            <div>
              <strong>${safe(p.name)}</strong>
              <p>${money(p.price)} × ${qty}</p>
              <button data-remove="${safe(id)}">Remove</button>
            </div>
            <div>
              <button data-change="${safe(id)}" data-amount="-1">−</button>
              ${qty}
              <button data-change="${safe(id)}" data-amount="1">+</button>
            </div>
          </div>`;
      }).join("")
    : "<p>Your cart is empty.</p>";

  document.querySelectorAll("[data-remove]").forEach(b => {
    b.addEventListener("click", () => {
      delete cart[b.dataset.remove];
      save("fsr_cart", cart);
      renderCart();
    });
  });

  document.querySelectorAll("[data-change]").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.change;
      cart[id] = (cart[id] || 0) + Number(b.dataset.amount);

      if (cart[id] <= 0) delete cart[id];

      save("fsr_cart", cart);
      renderCart();
    });
  });

  $("cartTotal").textContent = money(total());
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

// DISCOUNTS

$("applyDiscount").addEventListener("click", () => {
  const code = $("discountInput").value.trim().toUpperCase();

  discount = code === "FSR10" ? 0.10 : 0;

  $("discountMessage").textContent =
    discount ? "10% discount applied!" : "Invalid discount code.";

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

  const id = "FSR-" + Date.now().toString().slice(-8);

  const items = entries.map(([pid, qty]) => {
    const p = products.find(item => item.id === pid);
    return `${p.name} x${qty} - ${money(p.price * qty)}`;
  });

  const summary = [
    `Florida State Roleplay Order ${id}`,
    ...items,
    `Total: ${money(total())}`,
    "Please help me complete this order."
  ].join("\n");

  // Open Discord immediately from the click.
  window.open(DISCORD_URL, "_blank", "noopener");

  orders.unshift({
    id,
    date: new Date().toLocaleString(),
    items,
    total: total(),
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
    alert("Order saved locally. Please contact staff on Discord.");
  }
});

// DISCORD STATISTICS

async function loadDiscordStats() {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`,
      {cache:"no-store"}
    );

    if (!response.ok) throw new Error("Unavailable");

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

// REVIEWS - SAVED AND DISPLAYED

function renderReviews() {
  $("reviewsList").innerHTML = reviews.length
    ? reviews.map(review => `
      <article class="review-card">
        <strong>${safe(review.name)}</strong>
        <div class="stars">
          ${"★".repeat(review.rating)}${"☆".repeat(5-review.rating)}
        </div>
        <p>${safe(review.text)}</p>
        <small>${safe(review.date)}</small>
      </article>
    `).join("")
    : "<p>No reviews yet. Be the first to leave one!</p>";
}

$("reviewForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("reviewName").value.trim();
  const text = $("reviewText").value.trim();
  const rating = Number($("reviewRating").value);

  if (!name || !text || rating < 1 || rating > 5) return;

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

  alert("Your review has been saved!");
});

// ORDER HISTORY

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

// ADMIN LOGIN

let adminLoggedIn = false;

$("adminLoginForm").addEventListener("submit", event => {
  event.preventDefault();

  const password = $("adminPassword").value;

  if (password === ADMIN_PASSWORD) {
    adminLoggedIn = true;

    $("adminLoginMessage").textContent = "Login successful!";
    $("adminLoginForm").hidden = true;
    $("adminDashboard").hidden = false;

    updateAdmin();
  } else {
    $("adminLoginMessage").textContent = "Incorrect password!";
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
    alert("Enter valid product details.");
    return;
  }

  products.push(product);
  save("fsr_products", products);

  $("productForm").reset();
  renderProducts();
  updateAdmin();

  alert("Product added successfully!");
});

// ADMIN STATISTICS

function updateAdmin() {
  $("adminProducts").textContent = products.length;
  $("adminOrders").textContent = orders.length;
  $("adminReviews").textContent = reviews.length;
}

// START WEBSITE

renderProducts();
renderCart();
renderReviews();
renderOrders();
updateAdmin();
