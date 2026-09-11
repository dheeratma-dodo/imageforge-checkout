import DodoPayments from "dodopayments";

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const dodopayments = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  });

  const rawBody = await readRawBody(req);

  try {
    const event = dodopayments.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": req.headers["webhook-id"],
        "webhook-signature": req.headers["webhook-signature"],
        "webhook-timestamp": req.headers["webhook-timestamp"],
      },
    });

    console.log(`[dodo webhook] received ${event.type}`);

    if (event.type === "payment.succeeded" || event.type === "subscription.active") {
      console.log(`[dodo webhook] access granted for customer ${event.data.customer?.customer_id}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    res.status(401).json({ error: "Invalid signature" });
  }
}
