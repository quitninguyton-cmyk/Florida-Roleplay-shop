L
const productContainer = document.getElementById("products");

function displayProducts(items) {
  productContainer.innerHTML = "";

  items.forEach(product => {
    const card = document.createElement("div");
    card.className = "product";

    card.innerHTML = `
      <div class="emoji">${product.emoji}</div>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="price">${product.price}</div>
      <button class="buy-btn">Purchase</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      const message = product.role
        ? `You selected ${product.name}!\n\nIncludes the ${product.role} Discord role.\n\nPlease open a ticket to purchase.`
        : `You selected ${product.name}!\n\nPlease open a ticket in our Discord server to continue.`;

      alert(message);
    });

    productContainer.appendChild(card);
  });
}

function filterProducts(category) {
  displayProducts(
    category === "all"
      ? products
      : products.filter(product => product.category === category)
  );
}

displayProducts(products);
