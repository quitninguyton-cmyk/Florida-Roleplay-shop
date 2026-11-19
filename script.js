
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
      alert("To purchase " + product.name +
        ", please open a ticket in our Discord server!");
    });

    productContainer.appendChild(card);
  });
}

function filterProducts(category) {
  if (category === "all") {
    displayProducts(products);
  } else {
    displayProducts(
      products.filter(product => product.category === category)
    );
  }
}

displayProducts(products);
