interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    total: number;
    productImage?: string | null;
}

interface OrderEmailData {
    firstName: string;
    lastName: string;
    orderNumber: string;
    createdAt: Date | string;
    items: OrderItem[];
    subtotal: number;
    shippingCost?: number;
    tax?: number;
    total: number;
    shippingAddress: string;
    paymentMethod: string;
}

export const orderConfirmationTemplate = (data: OrderEmailData): string => {
    const name = data.firstName + " " + data?.lastName;
    const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151;">
        ${item.productName}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151;text-align:right;">
        $${item.price.toFixed(2)}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151;text-align:right;font-weight:600;">
        $${item.total.toFixed(2)}
      </td>
    </tr>
  `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:#2563EB;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Bestiee</h1>
              <p style="margin:6px 0 0;color:#BFDBFE;font-size:14px;">Your order has been confirmed!</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Thank you, ${name}  ! 🎉</h2>
              <p style="margin:0;font-size:14px;color:#6B7280;line-height:1.6;">
                We've received your order and it's being processed. Your invoice is attached to this email as a PDF.
              </p>
            </td>
          </tr>

          <!-- Order Meta -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-right:1px solid #DBEAFE;">
                    <p style="margin:0 0 4px;font-size:11px;color:#3B82F6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Order Number</p>
                    <p style="margin:0;font-size:15px;color:#1E40AF;font-weight:700;">${data.orderNumber}</p>
                  </td>
                  <td style="padding:16px 20px;border-right:1px solid #DBEAFE;">
                    <p style="margin:0 0 4px;font-size:11px;color:#3B82F6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Order Date</p>
                    <p style="margin:0;font-size:14px;color:#1E3A8A;font-weight:600;">
                      ${new Date(data.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </td>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#3B82F6;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Payment</p>
                    <p style="margin:0;font-size:14px;color:#1E3A8A;font-weight:600;">${data.paymentMethod}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:24px 40px 0;">
              <h3 style="margin:0 0 12px;font-size:15px;color:#111827;font-weight:600;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #E5E7EB;">
                <thead>
                  <tr style="background:#F9FAFB;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
                    <th style="padding:10px 16px;text-align:right;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:16px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6B7280;">Subtotal</td>
                        <td style="padding:4px 0;font-size:13px;color:#374151;text-align:right;">$${data.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6B7280;">Shipping</td>
                        <td style="padding:4px 0;font-size:13px;color:#374151;text-align:right;">$${(data.shippingCost ?? 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6B7280;">Tax</td>
                        <td style="padding:4px 0;font-size:13px;color:#374151;text-align:right;">$${(data.tax ?? 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0 4px;font-size:15px;color:#111827;font-weight:700;border-top:2px solid #E5E7EB;">Total</td>
                        <td style="padding:10px 0 4px;font-size:15px;color:#2563EB;font-weight:700;text-align:right;border-top:2px solid #E5E7EB;">$${data.total.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:8px;padding:16px 20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Shipping Address</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${data.shippingAddress}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;text-align:center;border-top:1px solid #F3F4F6;margin-top:24px;">
              <p style="margin:0 0 6px;font-size:13px;color:#6B7280;">
                Questions? Contact us at <a href="mailto:hello@mybestiee.com.au" style="color:#2563EB;text-decoration:none;">hello@mybestiee.com.au</a>
              </p>
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Bestiee. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};