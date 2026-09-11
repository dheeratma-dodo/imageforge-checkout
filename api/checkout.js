import DodoPayments from "dodopayments";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID;
  if (!productId) {
    res.status(500).json({ error: "Product is not configured" });
    return;
  }

  const dodopayments = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
  });

  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${req.headers.host}`;

  try {
    const session = await dodopayments.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: `${origin}/success.html`,
    });

    res.status(200).json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout" });
  }
}
