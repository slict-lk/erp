import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// The main verified domain for the system
const DEFAULT_SYSTEM_DOMAIN = process.env.SYSTEM_EMAIL_DOMAIN || "demo.slict.com";

/**
 * Generates a professional "From" address based on tenant settings.
 * Format: "Company Name <quotes@domain.com>"
 */
async function getFromAddress(tenantId?: string) {
    if (!tenantId) return `Slict Auto <quotes@${DEFAULT_SYSTEM_DOMAIN}>`;

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { companyName: true, name: true, domain: true }
    });

    if (!tenant) return `Slict Auto <quotes@${DEFAULT_SYSTEM_DOMAIN}>`;

    const displayName = tenant.companyName || tenant.name;

    // Logic: Use tenant's custom domain if they have one, otherwise use system default
    // IMPORTANT: Custom domains must be verified in Resend dashboard first
    const domain = tenant.domain || DEFAULT_SYSTEM_DOMAIN;

    return `${displayName} <quotes@${domain}>`;
}

export async function sendQuoteConfirmation(to: string, data: any, tenantId?: string) {
    if (!process.env.RESEND_API_KEY || !resend) {
        console.warn("Resend not configured, skipping email");
        return;
    }

    const { name, vehicle, country, port, totalCIF } = data;
    const fromAddress = await getFromAddress(tenantId);

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
        const { data: resendData, error } = await resend.emails.send({
            from: fromAddress,
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

export async function sendQuotation(to: string, data: any, tenantId?: string) {
    if (!process.env.RESEND_API_KEY || !resend) return;

    const { name, vehicle, quoteLink } = data;
    const fromAddress = await getFromAddress(tenantId);

    const html = `
    <h1>Good News, ${name}!</h1>
    <p>Your quotation for the <strong>${vehicle.year} ${vehicle.make} ${vehicle.model}</strong> is ready.</p>
    
    <p>Please click the link below to view your official quote and proceed with the purchase.</p>
    
    <a href="${quoteLink}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Quote</a>
    
    <p>If you have any questions, simply reply to this email.</p>
  `;

    try {
        await resend.emails.send({
            from: fromAddress,
            to: [to],
            subject: `Your Quotation is Ready - ${vehicle.stockNumber}`,
            html,
        });
    } catch (err) {
        console.error("Email Send Failed:", err);
    }
}
