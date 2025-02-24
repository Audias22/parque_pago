require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(cors());

app.post("/crear-checkout-session", async (req, res) => {
    const { items } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: items.map(item => ({
                price: item.priceId,
                quantity: item.quantity,
                adjustable_quantity: { // 🔹 Esto permite modificar la cantidad en Stripe
                    enabled: true,
                    minimum: 1,
                    maximum: 10 // Puedes cambiarlo si quieres otro límite
                }
            })),
            mode: "payment",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://127.0.0.1:5501/index.html",
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
