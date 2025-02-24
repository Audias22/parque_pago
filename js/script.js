import KEYS from "../assets/Keys.js";

const $d = document;
const $entradas = $d.getElementById("entradas");
const $template = $d.getElementById("entrada-template")?.content;
const $fragment = $d.createDocumentFragment();
const options = { headers: { Authorization: `Bearer ${KEYS.secret}` } };
const FormatoDeMoneda = num => `Q ${num.slice(0, -2)}.${num.slice(-2)}`;

let products, prices;

Promise.all([
    fetch("https://api.stripe.com/v1/products", options),
    fetch("https://api.stripe.com/v1/prices", options)
])
.then(responses => Promise.all(responses.map(res => res.json())))
.then(json => {
    products = json[0].data;
    prices = json[1].data;

    prices.forEach(el => {
        let productData = products.find(product => product.id === el.product);

        if ($template) {
            $template.querySelector(".entrada").setAttribute("data-price", el.id);
            $template.querySelector("img").src = productData.images[0];
            $template.querySelector("img").alt = productData.name;
            $template.querySelector("figcaption").innerHTML = `${productData.name} ${FormatoDeMoneda(el.unit_amount_decimal)} ${(el.currency).toUpperCase()}`;

            let $clone = $d.importNode($template, true);
            $fragment.appendChild($clone);
        }
    });

    if ($entradas) {
        $entradas.appendChild($fragment);
    }
})
.catch(error => {
    let message = error.statusText || "Ocurrió un error en la petición";
    if ($entradas) {
        $entradas.innerHTML = `Error: ${error.status}: ${message}`;
    }
});

$d.addEventListener("click", e => {
    if (e.target.matches(".comprar")) {
        console.log("✅ Botón Comprar clickeado");
        let entradaElement = e.target.closest(".entrada");
        console.log("🔍 Entrada seleccionada:", entradaElement);

        let priceId = entradaElement.getAttribute("data-price");
        let cantidad = 1; // Siempre se inicia con 1 entrada en Stripe
        console.log("🛒 ID del precio:", priceId);
        console.log("🔢 Cantidad seleccionada:", cantidad);

        if (cantidad < 1) {
            alert("Debe seleccionar al menos una entrada.");
            return;
        }

        // 🔹 Verificar qué datos estamos enviando al backend
        const requestData = { items: [{ priceId, quantity: cantidad }] };
        console.log("📤 Enviando datos al backend:", requestData);

        fetch("http://localhost:3000/crear-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [{ priceId, quantity: cantidad }] }) // 🔹 Enviamos al backend
        })
        .then(res => res.json())
        .then(data => {
            Stripe(KEYS.public).redirectToCheckout({ sessionId: data.id }); // 🔹 Stripe maneja el pago
        })
        .catch(error => console.error("Error en la sesión de pago:", error));
    }
});

// ✅ ASIGNAR EVENTO AL BOTÓN "VOLVER AL INICIO"
document.addEventListener("DOMContentLoaded", function () {
    console.log("🔹 Todos los scripts han sido cargados correctamente.");

    let goHomeButton = document.getElementById("goHome");
    if (goHomeButton) {
        console.log("✅ Botón 'Volver al Inicio' encontrado.");
        goHomeButton.addEventListener("click", function () {
            console.log("✅ Botón de volver al inicio clickeado.");
            window.location.href = "http://127.0.0.1:5501/index.html";
        });
    } else {
        console.error("❌ Error: Botón 'Volver al Inicio' NO encontrado.");
    }

    let downloadImageButton = document.getElementById("downloadImage");
    if (downloadImageButton) {
        downloadImageButton.addEventListener("click", downloadImage);
        console.log("✅ Evento asignado al botón Descargar Imagen.");
    } else {
        console.warn("⚠️ Botón Descargar Imagen NO encontrado.");
    }

    let downloadPDFButton = document.getElementById("downloadPDF");
    if (downloadPDFButton) {
        downloadPDFButton.addEventListener("click", downloadPDF);
        console.log("✅ Evento asignado al botón Descargar PDF.");
    } else {
        console.warn("⚠️ Botón Descargar PDF NO encontrado.");
    }

    console.log("✅ Todos los eventos fueron asignados correctamente.");
});
