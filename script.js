
const products = [
  // DONATIONS
  {
    name: "Small Donation",
    description: "Help support Florida State Roleplay.",
    price: "$2",
    emoji: "💵",
    category: "donations"
  },
  {
    name: "Supporter Donation",
    description: "Show your support for our community.",
    price: "$5",
    emoji: "💚",
    category: "donations"
  },
  {
    name: "Big Supporter",
    description: "Make a bigger contribution!",
    price: "$10",
    emoji: "💎",
    category: "donations"
  },
  {
    name: "Major Donation",
    description: "A generous contribution to our server.",
    price: "$20",
    emoji: "🌴",
    category: "donations"
  },
  {
    name: "Legendary Donation",
    description: "Become a legendary supporter!",
    price: "$50",
    emoji: "👑",
    category: "donations"
  },

  // SPECIAL
  {
    name: "Special Supporter",
    description: "Receive the Special Supporter Discord role.",
    price: "$10",
    emoji: "⭐",
    category: "special",
    role: "Special Supporter"
  },
  {
    name: "Elite Supporter",
    description: "Receive the exclusive Elite Supporter Discord role.",
    price: "$20",
    emoji: "🏆",
    category: "special",
    role: "Elite Supporter"
  },

  // MEMBERSHIPS
  {
    name: "Bronze Membership",
    description: "Start enjoying exclusive membership perks.",
    price: "$5",
    emoji: "🥉",
    category: "memberships"
  },
  {
    name: "Silver Membership",
    description: "Unlock additional membership benefits.",
    price: "$10",
    emoji: "🥈",
    category: "memberships"
  },
  {
    name: "Gold Membership",
    description: "Get our premium membership experience!",
    price: "$20",
    emoji: "🥇",
    category: "memberships"
  },


  // Partnerships 

      name: "🤝Partnership-No ping",
    description: "Start enjoying having more members.",
    price: "$2",
    emoji: "🤝",
    category: "partnerships"
  },
  {
name: "🤝Partnership-here ping",
    description: "Start enjoying having alot more members.",
    price: "$9",
    emoji: "🤝",
    category: "partnerships"
  };

const productContainer = document.getElementById("products");

function displayProducts(items) {
  if (!productContainer) {
    console.error("Could not find products container!");
    return;
  

  productContainer.innerHTML = "";

  items.forEach(product => {
    const card = document.createElement("div");
    card.className = "product";

    const emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.textContent = product.emoji;

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description;

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = product.price;

    const button = document.createElement("button");
    button.className = "buy-btn";
    button.textContent = "Purchase";

    button.addEventListener("click", () => {
      const roleText = product.role
        ? "\nIncludes: " + product.role + " role."
        : "";

      const confirmed = confirm(
        "You selected " + product.name +
        "\nPrice: " + product.price +
        roleText +
        "\n\nContinue to our Discord?"
      );

      if (confirmed) {
        window.open("https://discord.gg/fsrpnw", "_blank");
      }
    });

    card.append(emoji, title, description, price, button);
    productContainer.appendChild(card);
  });

  console.log("Successfully loaded " + items.length + " products!");
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

// Load all products when the page opens
displayProducts(products);
