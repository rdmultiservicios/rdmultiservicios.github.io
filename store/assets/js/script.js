// Estructura básica para los productos
const products = [
    { id: 1, name: "Headphones Wireless", price: 107, img: "assets/images/product/prodact-card-1.png" },
    { id: 2, name: "Gaming Headphone", price: 39.85, img: "assets/images/product/prodact-card-2.png" },
    { id: 3, name: "Headphone with Mic", price: 96.85, img: "assets/images/product/prodact-card-3.png" },
    { id: 4, name: "Galaxy Android Tablet", price: 288, img: "assets/images/product/prodact-card-4.png" }
];

let cart = []; // El carrito es un arreglo de objetos
let discount = 0; // Variable para guardar el descuento (en porcentaje)
let discountCode = ""; // Almacenar el código de descuento ingresado

// Definimos códigos de descuento válidos (pueden ser códigos que otorguen un descuento fijo o porcentaje)
const discountCodes = {
    "DESCUENTO10": 10, // 10% de descuento
    "DESCUENTO20": 20, // 20% de descuento
    "DESCUENTO50": 50  // 50% de descuento
};

// Función para agregar un producto al carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        // Comprobar si el producto ya está en el carrito
        const existingProduct = cart.find(p => p.id === productId);

        if (existingProduct) {
            // Si el producto ya está, incrementamos la cantidad
            existingProduct.quantity += 1;
        } else {
            // Si el producto no está en el carrito, lo agregamos con cantidad 1
            cart.push({ ...product, quantity: 1 });
        }

        // Actualizar el carrito visualmente
        updateCart();
    }
}

// Función para vaciar el carrito
function emptyCart() {
    cart = []; // Vaciar el carrito
    discount = 0; // Restablecer el descuento
    discountCode = ""; // Restablecer el código de descuento
    updateCart(); // Actualizar la visualización del carrito
}

// Función para actualizar la visualización del carrito
function updateCart() {
    // Actualizar el número de artículos en el ícono del carrito
    const cartItemCount = document.getElementById('cart-item-count');
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartItemCount.textContent = totalItems;

    // Actualizar los productos en el carrito
    const cartItemsList = document.getElementById('cart-items-list');
    cartItemsList.innerHTML = ''; // Limpiar lista de productos

    let subtotal = 0;

    cart.forEach(product => {
        const li = document.createElement('li');
        li.classList.add('woocommerce-mini-cart-item', 'mini_cart_item');
        li.innerHTML = `
            <a href="#" class="remove remove_from_cart_button" onclick="removeFromCart(${product.id})">
                <i class="bi bi-x"></i>
            </a>
            <a href="#">
                <img src="${product.img}" alt="${product.name}">${product.name}
            </a>
            <span class="quantity">
                ${product.quantity} ×
                <span class="woocommerce-Price-amount amount">
                    <span class="woocommerce-Price-currencySymbol">$</span>
                    ${product.price.toFixed(2)}
                </span>
            </span>
        `;
        cartItemsList.appendChild(li);
        subtotal += product.price * product.quantity;
    });

    // Mostrar el subtotal
    const cartSubtotal = document.getElementById('cart-subtotal');
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;

    // Calcular el total con descuento
    const total = subtotal - (subtotal * (discount / 100));

    // Mostrar el descuento
    const cartDiscount = document.getElementById('cart-discount');
    cartDiscount.textContent = `${discount}%`;

    // Mostrar el total
    const cartTotalPrice = document.getElementById('cart-total-price');
    cartTotalPrice.textContent = `$${total.toFixed(2)}`;

    // Mostrar el botón de WhatsApp solo si el carrito tiene productos
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (cart.length > 0) {
        whatsappBtn.style.display = 'inline-block'; // Mostrar el botón de WhatsApp
    } else {
        whatsappBtn.style.display = 'none'; // Ocultar el botón si el carrito está vacío
    }
}

// Función para eliminar un producto del carrito
function removeFromCart(productId) {
    const productIndex = cart.findIndex(p => p.id === productId);
    if (productIndex > -1) {
        cart.splice(productIndex, 1); // Eliminar el producto
        updateCart(); // Actualizar el carrito visualmente
    }
}

// Función para enviar el mensaje por WhatsApp
function sendWhatsAppMessage() {
    // Calcular el subtotal
    let subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Calcular el descuento aplicado
    const discountAmount = subtotal * (discount / 100);

    // Calcular el total después de aplicar el descuento
    const total = subtotal - discountAmount;

    // Construir el mensaje de WhatsApp
    let message = "*Detalles de su compra:*\n\n";
    cart.forEach(product => {
        const productTotal = (product.price * product.quantity).toFixed(2);  // Subtotal por producto
        message += `*${product.name}* - S/ ${product.price.toFixed(2)} (x${product.quantity}) = S/ ${productTotal}\n`;
    });
    message += `\n*Subtotal:* S/ ${subtotal.toFixed(2)}\n`;
    message += `*Descuento:* S/ ${discountAmount.toFixed(2)} (${discount}%)\n`; // Mostrar el descuento en negrita
    message += `*Total:* S/ ${total.toFixed(2)}\n`; // Mostrar el total en negrita

    // Enlace de WhatsApp
    const whatsappUrl = `https://wa.me/51939975800?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Asociar los eventos de clic para agregar al carrito
document.querySelectorAll('.add-to-cart-link').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
        const productId = parseInt(event.target.closest('.add-to-cart-link').dataset.productId);
        addToCart(productId);
    });
});

// Asociar el evento de vaciar carrito
document.getElementById('empty-cart-btn').addEventListener('click', emptyCart);

// Asociar el evento de aplicar código de descuento
document.getElementById('apply-discount-code-btn').addEventListener('click', () => {
    const codeInput = document.getElementById('discount-code-input').value.trim();
    if (discountCodes[codeInput]) {
        discount = discountCodes[codeInput]; // Aplicar el descuento
        discountCode = codeInput; // Guardar el código de descuento
        updateCart(); // Actualizar el carrito visualmente
        alert(`¡Código de descuento aplicado! ${discount}%`);
    } else {
        alert('El código de descuento no es válido.');
    }
});

// Asociar el evento de enviar por WhatsApp
document.getElementById('whatsapp-btn').addEventListener('click', () => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0) * (1 - (discount / 100));
    sendWhatsAppMessage(total);
});








