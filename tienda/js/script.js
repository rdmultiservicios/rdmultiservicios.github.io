// Inicializamos el carrito vacío
let cart = [];
let discountApplied = false; // Flag para saber si el descuento fue aplicado

// Función para añadir un producto al carrito
function addToCart(productId, productName, productPrice) {
    let quantity = document.getElementById(`quantity${productId}`).value;
    let color = document.getElementById(`color${productId}`).value;
    let size = document.getElementById(`size${productId}`).value;

    // Buscamos si el producto ya existe en el carrito
    let existingProductIndex = cart.findIndex(product => product.name === productName && product.color === color && product.size === size);

    if (existingProductIndex !== -1) {
        // Si el producto ya existe, sumamos la cantidad
        cart[existingProductIndex].quantity += parseInt(quantity);
    } else {
        // Si el producto no existe, lo añadimos al carrito
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: parseInt(quantity),
            color: color,
            size: size
        });
    }

    updateCartIcon();  // Actualizamos el icono del carrito
    renderCart();  // Actualizamos la vista del carrito
}

// Función para actualizar el número de productos en el icono del carrito
function updateCartIcon() {
    const cartItemCount = cart.reduce((total, product) => total + product.quantity, 0);
    document.getElementById("cart-item-count").textContent = cartItemCount;
}

// Función para renderizar los productos en el carrito en el HTML
function renderCart() {
    let cartHtml = '';
    let subtotal = 0;
    
    cart.forEach((product, index) => {
        const totalProductPrice = product.price * product.quantity;
        subtotal += totalProductPrice;

        cartHtml += `
            <div class="cart-item">
                <p>${product.name} - ${product.color} - ${product.size}</p>
                <p>Cantidad: <input type="number" value="${product.quantity}" onchange="updateQuantity(${product.id}, this.value)"></p>
                <p>Subtotal: $${totalProductPrice.toFixed(2)}</p>
                <button class = "btn btn-danger btn-sm" onclick="removeItem(${index})">Quitar</button>
                <hr>
            </div>
        `;
    });

    // Calculamos el total
    const discount = discountApplied ? 0.1 : 0; // Aplicamos un 10% de descuento si es válido
    const discountAmount = subtotal * discount;
    const total = subtotal - discountAmount;

    document.getElementById("cart-details").innerHTML = cartHtml;
    document.getElementById("cart-subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("cart-discount").textContent = discountApplied ? `Descuento: -$${discountAmount.toFixed(2)}` : `Descuento: No aplicado`;
    document.getElementById("cart-total").textContent = `Total: $${total.toFixed(2)}`;
}

// Función para actualizar la cantidad de un producto en el carrito
function updateQuantity(productId, newQuantity) {
    const product = cart.find(item => item.id === productId);
    if (product) {
        product.quantity = parseInt(newQuantity);
        renderCart();
    }
}

// Función para eliminar un producto del carrito
function removeItem(index) {
    cart.splice(index, 1);  // Eliminamos el producto en la posición especificada
    renderCart();  // Volvemos a renderizar el carrito
}

// Función para aplicar el descuento
function applyDiscount() {
    const discountCode = document.getElementById("discount-code").value;
    if (discountCode === "DESCUENTO10") {
        discountApplied = true;  // Si el código es correcto, aplicamos el descuento
        renderCart();  // Volvemos a renderizar el carrito
    } else {
        alert("Código de descuento inválido");
    }
}

// Función para vaciar el carrito
function emptyCart() {
    cart = [];  // Vaciar el carrito
    discountApplied = false;  // Restablecer el estado del descuento
    renderCart();  // Volver a renderizar el carrito
    updateCartIcon();  // Actualizar el icono del carrito
}

// Función para enviar el carrito por WhatsApp
function sendCartToWhatsApp() {
  let cartDetails = 'Detalles de la compra:\n';

  // Añadir los productos al detalle del carrito
  cart.forEach(product => {
      const totalProductPrice = product.price * product.quantity;
      cartDetails += `${product.name} (${product.color}, ${product.size}) x ${product.quantity} - $${product.price} c/u - Total: $${totalProductPrice.toFixed(2)}\n`;
  });

  // Calcular subtotal
  const subtotal = cart.reduce((total, product) => total + (product.price * product.quantity), 0);

  // Calcular el descuento (10% si se aplica)
  const discount = discountApplied ? 0.1 : 0;
  const discountAmount = subtotal * discount;

  // Calcular el total después del descuento
  const total = subtotal - discountAmount;

  // Mostrar descuento en el mensaje
  if (discountApplied) {
      cartDetails += `\nDescuento aplicado: -$${discountAmount.toFixed(2)} (Cupón: DESCUENTO10)`;
  } else {
      cartDetails += `\nDescuento: No aplicado`;
  }

  // Añadir el total a pagar
  cartDetails += `\n\nSubtotal: $${subtotal.toFixed(2)}`;
  cartDetails += `\nTotal a pagar: $${total.toFixed(2)}`;

  // Codificamos la URL para WhatsApp
  const message = encodeURIComponent(cartDetails);
  window.open(`https://wa.me/51939975800?text=${message}`, '_blank');

  // Vaciar el carrito después de enviar el mensaje
  emptyCart();
}



// Función para mostrar el carrito
function showCart() {
    document.getElementById("cart-modal").style.display = 'flex';
}

// Función para cerrar el carrito
function closeCart() {
    document.getElementById("cart-modal").style.display = 'none';
}


