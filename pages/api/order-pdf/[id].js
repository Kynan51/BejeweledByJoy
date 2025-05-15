import puppeteer from "puppeteer";
import supabase from "../../../utils/supabaseClient";

export default async function handler(req, res) {
  const {
    query: { id },
  } = req;

  // Fetch order and items from Supabase
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Fetch user profile for full_name and phone
  let fullName = "";
  let phone = order.phone || "";
  if (order.user_id) {
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("full_name, phone")
      .eq("id", order.user_id)
      .single();
    if (!userProfileError && userProfile) {
      fullName = userProfile.full_name || "";
      if (!phone) phone = userProfile.phone || "";
    }
  }

  // Build HTML for the order confirmation
  const html = `
    <html>
      <head>
        <meta charset='utf-8' />
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; }
          h1 { color: #7c3aed; }
          .order-info { margin-bottom: 24px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; }
          .items-table th { background: #f3f4f6; }
          .total { font-size: 1.2em; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Order Confirmation</h1>
        <div class="order-info">
          <div><strong>Order ID:</strong> ${order.id.substring(0, 8).toUpperCase()}</div>
          <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
          <div><strong>Status:</strong> ${order.status}</div>
          <div><strong>Name:</strong> ${fullName || "-"}</div>
          <div><strong>Phone:</strong> ${phone || "-"}</div>
          <div><strong>Address:</strong> ${order.shipping_address || "-"}</div>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.order_items
              .map(
                (item) => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>Ksh${item.product_price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>Ksh${(item.product_price * item.quantity).toFixed(2)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
        <div class="total">Total: Ksh${order.total_amount?.toFixed(2) ?? "-"}</div>
      </body>
    </html>
  `;

  try {
    // Log Chromium path for debugging
    console.log("Chromium executable path:", puppeteer.executablePath());
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu"
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=order-${order.id}.pdf`);
    res.status(200).end(pdfBuffer); // Use .end() for a Buffer!
  } catch (err) {
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
}
