import KEYS from "../assets/Keys.js"

const $d = document;
const $entradas = $d.getElementById("entradas");
const $template = $d.getElementById("entrada-template").content;
const $fragment = $d.createDocumentFragment();
const options = { headers: {Authorization: `Bearer ${KEYS.secret}`}}
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
        let productData = products.filter(product => product.id === el.product);
        
        $template.querySelector(".entrada").setAttribute("data-price", el.id);
        $template.querySelector("img").src = productData[0].images[0];
        $template.querySelector("img").alt = productData[0].name;
        $template.querySelector("figcaption").innerHTML = `${productData[0].name} ${FormatoDeMoneda(el.unit_amount_decimal)} ${(el.currency).toUpperCase()}`;

        let $clone = $d.importNode($template, true);

        $fragment.appendChild($clone);

    });

    $entradas.appendChild($fragment);

    })
    .catch(error => {
        let message = error.statuText || "Ocurrió un error en la petición";
    
        $entradas.innerHTML = `Error: ${error.status}: ${message}`;
    })

    $d.addEventListener("click", e => {
        if (e.target.matches(".entradas *")) {
            let priceId = e.target.parentElement.getAttribute("data-price");
    
            Stripe(KEYS.public).redirectToCheckout({
                lineItems: [{
                    price: priceId,
                    quantity: 1
                }],
                mode: "payment",
                successUrl:"http://127.0.01:5501/assets/success.html",
                cancelUrl:"http://127.0.01:5501/assets/cancel.html"
            })
            .then(res => {
                if (res.error){
                    $entradas.insertAdjacentElement("afterend", res.error.message)
                }
            })
        }
    })