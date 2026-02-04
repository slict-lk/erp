import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = "quotes@demo.slict.com"; // Replace with verified domain in production

export async function sendQuoteConfirmation(to: string, data: any) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY missing, skipping email");
        return;
    }
    console.log("Sending email with key:", process.env.RESEND_API_KEY.slice(0, 5) + "...");

    const { name, vehicle, country, port, totalCIF } = data;

    const subject = `Quote Request Received: ${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    const html = `
    <h1>Hello ${name},</h1>
    <p>Thank you for requesting a quote for the <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong> (Stock: ${vehicle.stockNumber}).</p>
    
    <h3>Shipping Details</h3>
    <ul>
      <li><strong>Destination:</strong> ${port.name}, ${country.name}</li>
      <li><strong>Estimated CIF:</strong> ${totalCIF ? `$${totalCIF.toLocaleString()}` : 'Price on Request'}</li>
    </ul>

    <p>Our team will review the shipping costs and send you an official proforma invoice shortly.</p>
    
    <p>Best regards,<br/>Sales Team</p>
  `;

    try {
        if (!resend) {
            console.warn("Resend client not initialized. Check RESEND_API_KEY.");
            return;
        }

        const { data: resendData, error } = await resend.emails.send({
            from: "Slict Auto <onboarding@resend.dev>", // Default for testing
            to: [to],
            subject,
            html,
        });

        if (error) console.error("Resend Error:", error);
        else console.log("Quote Confirmation Sent:", resendData?.id);
    } catch (err) {
        console.error("Email Send Failed:", err);
    }
}

export async function sendQuotation(to: string, data: any) {
    if (!process.env.RESEND_API_KEY) return;

    const { name, vehicle, quoteLink } = data;

    const html = `
    <h1>Good News, ${name}!</h1>
    <p>Your quotation for the <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong> is ready.</p>
    
    <p>Please click the link below to view your official quote and proceed with the purchase.</p>
    
    <a href="${quoteLink}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Quote</a>
    
    <p>If you have any questions, simply reply to this email.</p>
  `;

    if (!resend) {
        console.warn("Resend client not initialized. Check RESEND_API_KEY.");
        return;
    }

    await resend.emails.send({
        from: "Slict Auto <onboarding@resend.dev>",
        to: [to],
        subject: `Your Quotation is Ready - ${vehicle.stockNumber}`,
        html,
    });
}
