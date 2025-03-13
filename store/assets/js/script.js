// Estructura básica para los productos
const products = [
    { id: 1, name: "Auriculares Bluetooth", price: 69.00, img: "assets/images/product/prodact-card-1.png", sku: "AB123" },
    { id: 2, name: "Auriculares Gamer", price: 89.00, img: "assets/images/product/prodact-card-2.png", sku: "AG456" },
    { id: 3, name: "Auriculares Microfono", price: 99.00, img: "assets/images/product/prodact-card-3.png", sku: "JBLT500BLUAM" },
    { id: 4, name: "Samsung Galaxy A52s", price: 899.00, img: "assets/images/product/prodact-card-4.png", sku: "SG123" },
    { id: 5, name: "Headphones Wireless", price: 39.90, img: "assets/images/product/prodact-card-1.png", sku: "HW234" },
    { id: 6, name: "Gaming Headphone", price: 19.90, img: "assets/images/product/prodact-card-2.png", sku: "GH567" },
    { id: 7, name: "Headphone with Mic", price: 29.90, img: "assets/images/product/prodact-card-3.png", sku: "HM890" }
];

let cart = []; // El carrito es un arreglo de objetos
let discount = 0; // Variable para guardar el descuento (en porcentaje)
let discountCode = ""; // Almacenar el código de descuento ingresado

// Definimos códigos de descuento válidos (pueden ser códigos que otorguen un descuento fijo o porcentaje)
const discountCodes = {
    "DESCUENTO10": { type: "percentage", value: 10, expiration: "2025-12-31" },  // 10% de descuento
    "DESCUENTO20": { type: "percentage", value: 20, expiration: "2025-06-30" },  // 20% de descuento
    "DESCUENTO50": { type: "percentage", value: 50, expiration: "2025-01-01" },  // 50% de descuento
    "DESCUENTO100": { type: "fixed", value: 100, expiration: "2025-12-31" }, // S/ 100 de descuento
    "DESCUENTO50F": { type: "fixed", value: 50, expiration: "2025-06-30" }   // S/ 50 de descuento
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
            // Actualizamos el precio por si hubo algún cambio
            existingProduct.price = product.price;
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
    localStorage.removeItem('cart'); // Eliminar el carrito del localStorage
    updateCart(); // Actualizar la visualización del carrito
}

// Función para actualizar el carrito y guardarlo en el localStorage
function updateCart() {
    const cartItemCount = document.getElementById('cart-item-count');
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartItemCount.textContent = totalItems;

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
            <span class="text-muted" style="font-size: 0.75rem; display: block;">SKU: ${product.sku}</span>
            <span class="quantity">
                ${product.quantity} ×
                <span class="woocommerce-Price-amount amount">
                    <span class="woocommerce-Price-currencySymbol">S/</span>
                    ${product.price.toFixed(2)}
                </span>
            </span>
        `;
        cartItemsList.appendChild(li);
        subtotal += product.price * product.quantity;
    });

    const cartSubtotal = document.getElementById('cart-subtotal');
    cartSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;

    // Cálculo del total con descuento aplicado
    let total = subtotal;
    if (discount > 0 && discountCode && discountCodes[discountCode]) {
        const coupon = discountCodes[discountCode];
        if (coupon.type === "percentage") {
            total -= subtotal * (discount / 100);
        } else if (coupon.type === "fixed") {
            total -= discount;
        }
    }

    const cartDiscount = document.getElementById('cart-discount');
    cartDiscount.textContent = discount > 0 ? `${discount} ${discountCodes[discountCode].type === 'percentage' ? "%" : "S/"}` : "0";

    const cartTotalPrice = document.getElementById('cart-total-price');
    cartTotalPrice.textContent = `S/ ${total.toFixed(2)}`;

    const whatsappBtn = document.getElementById('whatsapp-btn');
    whatsappBtn.style.display = cart.length > 0 ? 'inline-block' : 'none';

    // Guardar carrito en el localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}


// Cargar el carrito desde el localStorage cuando se carga la página
window.onload = function () {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);

        // Verificar si los productos en el carrito siguen siendo válidos
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                // Actualizar precio si ha cambiado
                item.price = product.price;

                // Si el producto ya no está disponible (por ejemplo, no existe en el stock),
                // eliminarlo del carrito
                if (!product) {
                    const index = cart.indexOf(item);
                    if (index !== -1) {
                        cart.splice(index, 1); // Eliminar producto no disponible
                    }
                }
            } else {
                // El producto ya no existe, eliminamos del carrito
                const index = cart.indexOf(item);
                if (index !== -1) {
                    cart.splice(index, 1);
                }
            }
        });
        
        // Actualizamos la visualización del carrito después de verificarlo
        updateCart(); 
    } else {
        cart = [];
    }
};

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
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    let subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;

    let message = "¡Hola! Quiero comprar estos productos:\n\n*Detalles de su compra:*\n\n";
    
    // Agregar productos al mensaje
    cart.forEach(product => {
        const productTotal = (product.price * product.quantity).toFixed(2);
        message += `*${product.name}* - S/ ${product.price.toFixed(2)} (x${product.quantity})\n`;
        message += `SKU: ${product.sku}\n`; 
    });

    // Agregar el subtotal
    message += `\n*Subtotal:* S/ ${subtotal.toFixed(2)}\n`;

    // Si hay un descuento aplicado, lo agregamos al mensaje
    if (discount > 0) {
        message += `*Descuento:* S/ ${discountAmount.toFixed(2)} (${discount}%)\n`;
    }

    // Mostrar el código y el valor del cupón si se aplicó
    if (discountCode) {
        const coupon = discountCodes[discountCode];
        message += `\n*Cupón aplicado:* ${discountCode}\n`;
        message += `*Valor del cupón:* ${coupon.type === 'percentage' ? coupon.value + "%" : "S/ " + coupon.value}\n`;
    }

    // Mostrar el total
    message += `*Total pedido:* S/ ${total.toFixed(2)}\n`;

    // Enviar el mensaje por WhatsApp
    const whatsappUrl = `https://wa.me/51939975800?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    emptyCart();

    const discountInput = document.getElementById('discount-code-input');
    if (discountInput) {
        discountInput.value = ''; // Limpiar el campo de descuento
    }
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

// Función para mostrar el mensaje de alerta de descuento
function showDiscountAlert(message, isSuccess = true) {
    const discountAlert = document.getElementById('discount-alert');
    const discountAlertMessage = document.getElementById('discount-alert-message');
    const discountAlertIcon = document.getElementById('discount-alert-icon');

    // Limpiar cualquier mensaje previo
    discountAlert.classList.remove('alert-success', 'alert-danger', 'fade', 'show');
    discountAlert.classList.add('alert', 'd-flex', 'align-items-center', 'fade'); // Aseguramos que la alerta tenga clase 'fade' para transición

    // Limpiar cualquier ícono previo
    discountAlertIcon.classList.remove('bi-check-circle', 'bi-exclamation-triangle'); // Limpiar íconos previos

    // Establecer el mensaje
    discountAlertMessage.textContent = message;

    // Usar clases de Bootstrap para éxito y error
    if (isSuccess) {
        discountAlert.classList.add('alert-success'); // Verde para éxito
        discountAlertIcon.classList.add('bi-check-circle'); // Ícono de éxito
    } else {
        discountAlert.classList.add('alert-danger'); // Rojo para error
        discountAlertIcon.classList.add('bi-exclamation-triangle'); // Ícono de error
    }

    // Agregar espaciado entre el ícono y el mensaje usando la clase "me-2" de Bootstrap
    discountAlertIcon.classList.add('me-2'); // Espacio a la derecha del ícono

    // Mostrar la alerta
    discountAlert.style.display = 'flex';

    // Mostrar la alerta con animación de fade
    setTimeout(() => {
        discountAlert.classList.add('show'); // Agregar la clase 'show' para hacerla visible con fade-in
    }, 10); // Agregar un pequeño retraso para asegurar que se vea la animación

    // Ocultar el mensaje automáticamente después de 3 segundos con la animación de fade-out
    setTimeout(() => {
        discountAlert.classList.remove('show'); // Remover la clase 'show' para que desaparezca con fade-out
    }, 3000); // Después de 3 segundos

    // Ocultar el mensaje completamente después de la animación de desaparición
    setTimeout(() => {
        discountAlert.style.display = 'none'; // Establecer display a 'none' después de la animación
    }, 3500); // Después de 3.5 segundos para asegurarnos de que la animación haya terminado
}

// Asociar el evento de aplicar código de descuento
document.getElementById('apply-discount-code-btn').addEventListener('click', (event) => {
    event.preventDefault(); // Prevenir la recarga de la página

    const codeInput = document.getElementById('discount-code-input').value.trim();
    
    if (!codeInput) {
        // Mostrar alerta si no se ingresa un código
        showDiscountAlert('Por favor, ingresa un cupón de descuento', false);
        return;
    }

    const coupon = discountCodes[codeInput.toUpperCase()];
    
    if (!coupon) {
        // Mostrar alerta si el código no existe
        showDiscountAlert('Este cupón no es válido.', false);
        return;
    }

    const currentDate = new Date();
    const expirationDate = new Date(coupon.expiration);

    if (currentDate > expirationDate) {
        // Mostrar alerta si el cupón ha caducado
        showDiscountAlert('Este cupón ha caducado.', false);
        return;
    }

    // Aplicar el descuento dependiendo del tipo
    if (coupon.type === "percentage") {
        discount = coupon.value;
        discountCode = codeInput.toUpperCase();
        showDiscountAlert(`¡Cupón aplicado con éxito! ${discount}%`);
    } else if (coupon.type === "fixed") {
        discount = coupon.value;
        discountCode = codeInput.toUpperCase();
        showDiscountAlert(`¡Cupón aplicado con éxito! S/ ${discount}`);
    }

    updateCart(); // Actualizar el carrito visualmente
});

// Asociar el evento de enviar por WhatsApp
document.getElementById('whatsapp-btn').addEventListener('click', () => {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0) * (1 - (discount / 100));
    sendWhatsAppMessage(total);
});
