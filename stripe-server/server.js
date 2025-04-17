require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(cors());

// ✅ CREAR CHECKOUT SESSION
app.post("/crear-checkout-session", async (req, res) => {
  const { items } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity || 1,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: 100
        }
      })),
      success_url: `http://127.0.0.1:5501/assets/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://127.0.0.1:5501/index.html",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("❌ Error al crear sesión de checkout:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ OBTENER DETALLES DE LA SESIÓN
app.get("/obtener-detalles-sesion", async (req, res) => {
  const sessionId = req.query.session_id;

  try {
    if (!sessionId) {
      return res.status(400).json({ error: "❌ No se proporcionó session_id." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

    if (!session || !session.payment_intent) {
      return res.status(404).json({ error: "❌ No se encontró la sesión de Stripe." });
    }

    const transactionId = session.payment_intent;
    const tipoEntrada = lineItems.data[0]?.description || "Desconocido";
    const montoTotal = session.amount_total || 0;

    res.json({
      transactionId,
      tipoEntrada,
      montoTotal,
    });
  } catch (error) {
    console.error("❌ Error al obtener detalles de la sesión:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ INICIAR SERVIDOR
app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));
