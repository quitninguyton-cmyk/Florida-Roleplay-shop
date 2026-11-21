
const DISCORD_INVITE = "fsrpnw";
const DISCORD_URL = "https://discord.gg/fsrpnw";

const defaultProducts = [
  {id:"donation-2",name:"Small Donation",description:"Help support Florida State Roleplay.",price:2,emoji:"💵",category:"donations",featured:true},
  {id:"donation-5",name:"Supporter Donation",description:"Show your support for our community.",price:5,emoji:"💚",category:"donations"},
  {id:"donation-10",name:"Big Supporter",description:"Make a bigger contribution!",price:10,emoji:"💎",category:"donations"},
  {id:"donation-20",name:"Major Donation",description:"A generous contribution to our server.",price:20,emoji:"🌴",category:"donations"},
  {id:"donation-50",name:"Legendary Donation",description:"Become a legendary supporter!",price:50,emoji:"👑",category:"donations"},
  {id:"special-supporter",name:"Special Supporter",description:"Receive the Special Supporter Discord role.",price:10,emoji:"⭐",category:"special",role:"Special Supporter",featured:true},
  {id:"elite-supporter",name:"Elite Supporter",description:"Receive the exclusive Elite Supporter Discord role.",price:20,emoji:"🏆",category:"special",role:"Elite Supporter"},
  {id:"bronze",name:"Bronze Membership",description:"Start enjoying exclusive membership perks.",price:5,emoji:"🥉",category:"memberships"},
  {id:"silver",name:"Silver Membership",description:"Unlock additional membership benefits.",price:10,emoji:"🥈",category:"memberships"},
  {id:"gold",name:"Gold Membership",description:"Get our premium membership experience!",price:20,emoji:"🥇",category:"memberships",featured:true}
];

const $ = id => document.getElementById(id);
const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = amount => "$" + amount.toFixed(2);
const safe = value => String(value).replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[char]);

let products = read("fsr_products", defaultProducts);
let cart = read("fsr_cart", {});
let orders = read("fsr_orders", []);
let reviews = read("fsr_reviews", []);
let currentCategory = "all";
let discount = 0;

// PRODUCTS

function renderProducts() {
  const query = $("searchInput").value.toLowerCase();

  const filtered = products.filter(product =>
    (currentCategory === "all" || product.category === currentCategory) &&
    (product.name.toLowerCase().includes(query) ||
     product.description.toLowerCase().includes(query))
  );

  $("products").innerHTML = filtered.length
    ? filtered.map(productCard).join("")
    : "<p>No products found. Try another search.</p>";

  $("featuredProducts").innerHTML = products
    .filter(p => p.featured)
    .map(productCard)
    .join("");

  document.querySelectorAll(".add-cart").forEach(button => {
    button.addEventListener("click", () => addToCart(button.dataset.id));
  });
}

function productCard(p) {
  return `
    <article class="product">
      ${p.featured ? '<span class="featured-label">★ FEATURED</span>' : ""}
      <div class="emoji">${safe(p.emoji || "🌴")}</div>
      <h3>${safe(p.name)}</h3>
      <p>${safe(p.description)}</p>
      ${p.role ? `<small>Includes: ${safe(p.role)} role</small>` : ""}
      <div class="price">${money(Number(p.price))}</div>
      <button class="primary-btn add-cart" data-id="${safe(p.id)}">
        Add to cart
      </button>
    </article>`;
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.category;
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    renderProducts();
  });
});

$("searchInput").addEventListener("input", renderProducts);

// CART

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  cart[id] = (cart[id] || 0) + 1;
  save("fsr_cart", cart);
  renderCart();
  openCart();
}

function changeQuantity(id, amount) {
  cart[id] = (cart[id] || 0) + amount;
  if (cart[id] <= 0) delete cart[id];
  save("fsr_cart", cart);
  renderCart();
}

function calculateTotal() {
  let subtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find(p => p.id === id);
    return sum + (product ? Number(product.price) * qty : 0);
  }, 0);

  return {
    subtotal,
    total: Math.max(0, subtotal * (1 - discount))
  };
}

function renderCart() {
  const entries = Object.entries(cart).filter(([id]) =>
    products.some(p => p.id === id)
  );

  $("cartCount").textContent = entries.reduce((sum, [,qty]) => sum + qty, 0);

  $("cartItems").innerHTML = entries.length
    ? entries.map(([id, qty]) => {
        const p = products.find(item => item.id === id);
        return `
          <div class="cart-item">
            <div>
              <strong>${safe(p.name)}</strong>
              <p>${money(Number(p.price))} × ${qty}</p>
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

  document.querySelectorAll("[data-remove]").forEach(button =>
    button.addEventListener("click", () => {
      delete cart[button.dataset.remove];
      save("fsr_cart", cart);
      renderCart();
    })
  );

  document.querySelectorAll("[data-change]").forEach(button =>
    button.addEventListener("click", () =>
      changeQuantity(button.dataset.change, Number(button.dataset.amount))
    )
  );

  const totals = calculateTotal();
  $("cartTotal").textContent = money(totals.total);
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

// DISCOUNT CODES

$("applyDiscount").addEventListener("click", () => {
  const code = $("discountInput").value.trim().toUpperCase();

  if (code === "FSR10") {
    discount = 0.10;
    $("discountMessage").textContent = "10% discount applied!";
  } else {
    discount = 0;
    $("discountMessage").textContent = "Invalid discount code.";
  }
  renderCart();
});

// CHECKOUT AND LOCAL ORDER HISTORY

$("checkoutBtn").addEventListener("click", async () => {
  const entries = Object.entries(cart).filter(([id, qty]) =>
    products.some(p => p.id === id) && qty > 0
  );

  if (!entries.length) {
    alert("Your cart is empty!");
    return;
  }

  const totals = calculateTotal();
  const orderId = "FSR-" + Date.now().toString().slice(-8);

  const lines = entries.map(([id, qty]) => {
    const p = products.find(item => item.id === id);
    return `${p.name} x${qty} - ${money(p.price * qty)}`;
  });

  const summary = [
    `Florida State Roleplay Order: ${orderId}`,
    ...lines,
    `Total: ${money(totals.total)}`,
    "Please help me complete this order."
  ].join("\n");

  orders.unshift({
    id: orderId,
    date: new Date().toLocaleString(),
    items: lines,
    total: totals.total,
    status: "Pending Discord confirmation"
  });

  save("fsr_orders", orders);
  save("fsr_cart", {});
  cart = {};
  discount = 0;

  renderCart();
  renderOrders();
  closeCart();

  try {
    await navigator.clipboard.writeText(summary);
    alert("Order summary copied! Paste it into our Discord after joining.");
  } catch {
    alert("Your order was saved locally. Please contact our Discord staff.");
  }

  window.open(DISCORD_URL, "_blank", "noopener");
});

// DISCORD LIVE COUNTS

async function loadDiscordStats() {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`,
      {cache: "no-store"}
    );

    if (!response.ok) throw new Error("Discord stats unavailable");

    const data = await response.json();

    $("totalMembers").textContent =
      Number(data.approximate_member_count || 0).toLocaleString();

    $("onlineMembers").textContent =
      Number(data.approximate_presence_count || 0).toLocaleString();

    $("serverStatus").textContent = "Online";
  } catch (error) {
    $("totalMembers").textContent = "Unavailable";
    $("onlineMembers").textContent = "Unavailable";
    $("serverStatus").textContent = "Check Discord";
    console.error("Discord count error:", error);
  }
}

loadDiscordStats();
setInterval(loadDiscordStats, 300000);

// REVIEWS

function renderReviews() {
  $("reviewsList").innerHTML = reviews.length
    ? reviews.map(review => `
      <article class="review-card">
        <strong>${safe(review.name)}</strong>
        <div class="stars">${"★".repeat(review.rating)}${"☆".repeat(5-review.rating)}</div>
        <p>${safe(review.text)}</p>
      </article>`).join("")
    : "<p>No reviews yet. Be the first!</p>";
}

$("reviewForm").addEventListener("submit", event => {
  event.preventDefault();

  reviews.unshift({
    name: $("reviewName").value.trim(),
    rating: Number($("reviewRating").value),
    text: $("reviewText").value.trim()
  });

  save("fsr_reviews", reviews);
  $("reviewForm").reset();
  renderReviews();
  updateAdmin();
});

// ORDER HISTORY

function renderOrders() {
  $("orderHistory").innerHTML = orders.length
    ? orders.map(order => `
      <article class="order-card">
        <strong>${safe(order.id)}</strong>
        <p>${safe(order.date)}</p>
        <p>${order.items.map(safe).join("<br>")}</p>
        <p>Total: ${money(Number(order.total))}</p>
        <small>${safe(order.status)}</small>
      </article>`).join("")
    : "<p>No orders on this browser yet.</p>";
}

// LOCAL ADMIN PRODUCT TOOL

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

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
    alert("Please enter valid product information.");
    return;
  }

  products.push(product);
  save("fsr_products", products);

  $("productForm").reset();
  renderProducts();
  updateAdmin();
  alert("Product added to this browser!");
});

function updateAdmin() {
  $("adminProducts").textContent = products.length;
  $("adminOrders").textContent = orders.length;
  $("adminReviews").textContent = reviews.length;
}

// INITIALIZE

renderProducts();
renderCart();
renderReviews();
renderOrders();
updateAdmin();
