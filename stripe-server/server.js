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
                adjustable_quantity: {
                    enabled: true,
                    minimum: 1,
                    maximum: 100
                }
            })),
            mode: "payment",
            success_url: `http://127.0.0.1:5501/assets/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: "http://127.0.0.1:5501/index.html",
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/obtener-detalles-sesion", async (req, res) => {
    const sessionId = req.query.session_id;

    try {
        if (!sessionId) {
            return res.status(400).json({ error: "❌ No se proporcionó session_id." });
        }

        console.log(`📌 Obteniendo detalles de sesión para: ${sessionId}`);

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

        if (!session || !session.payment_intent) {
            return res.status(404).json({ error: "❌ No se encontró la sesión de Stripe." });
        }

        let transactionId = session.payment_intent; // ✅ Este es el ID que debemos usar
        let tipoEntrada = lineItems.data[0]?.description || "Desconocido";
        let montoTotal = session.amount_total || 0;

        console.log("✅ Datos obtenidos de Stripe:");
        console.log("Transaction ID:", transactionId);
        console.log("Tipo de Entrada:", tipoEntrada);
        console.log("Monto Total:", montoTotal);

        res.json({
            transactionId: transactionId,
            tipoEntrada: tipoEntrada,
            montoTotal: montoTotal
        });

    } catch (error) {
        console.error("❌ Error al obtener detalles de la sesión de Stripe:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));