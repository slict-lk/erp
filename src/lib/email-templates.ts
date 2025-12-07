/**
 * Email Notification Templates
 * Ready-to-use HTML templates for various business notifications
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Base email wrapper
function wrapEmailContent(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background: #f3f4f6; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Company ERP</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from Your Company ERP System</p>
      <p>&copy; 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Invoice Created Notification
export function invoiceCreatedEmail(invoice: any): EmailTemplate {
  const content = `
    <h2>New Invoice Created</h2>
    <p>Dear ${invoice.customer?.name},</p>
    <p>A new invoice has been generated for you.</p>
    
    <table class="table">
      <tr>
        <th>Invoice Number</th>
        <td>${invoice.invoiceNumber}</td>
      </tr>
      <tr>
        <th>Issue Date</th>
        <td>${new Date(invoice.issueDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>Due Date</th>
        <td>${new Date(invoice.dueDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>Amount</th>
        <td><strong>$${invoice.total.toFixed(2)}</strong></td>
      </tr>
    </table>
    
    <p style="margin-top: 30px;">
      <a href="#" class="button">View Invoice</a>
    </p>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Please ensure payment is made by the due date to avoid any late fees.
    </p>
  `;

  return {
    subject: `Invoice ${invoice.invoiceNumber} - Due ${new Date(invoice.dueDate).toLocaleDateString()}`,
    html: wrapEmailContent(content),
    text: `New Invoice: ${invoice.invoiceNumber}\nAmount: $${invoice.total}\nDue: ${invoice.dueDate}`,
  };
}

// Payment Received Notification
export function paymentReceivedEmail(payment: any): EmailTemplate {
  const content = `
    <h2>Payment Received</h2>
    <p>Thank you for your payment!</p>
    
    <table class="table">
      <tr>
        <th>Payment Reference</th>
        <td>${payment.referenceNumber || 'N/A'}</td>
      </tr>
      <tr>
        <th>Amount</th>
        <td><strong>$${payment.amount.toFixed(2)}</strong></td>
      </tr>
      <tr>
        <th>Payment Date</th>
        <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>Payment Method</th>
        <td>${payment.paymentMethod}</td>
      </tr>
    </table>
    
    <p style="margin-top: 30px; color: #059669; font-size: 16px;">
      ✓ Your payment has been successfully processed.
    </p>
  `;

  return {
    subject: `Payment Confirmation - $${payment.amount.toFixed(2)}`,
    html: wrapEmailContent(content),
    text: `Payment Received: $${payment.amount}\nDate: ${payment.paymentDate}`,
  };
}

// Order Confirmation
export function orderConfirmationEmail(order: any): EmailTemplate {
  const content = `
    <h2>Order Confirmation</h2>
    <p>Dear ${order.customer?.name},</p>
    <p>Thank you for your order! We've received it and are processing it now.</p>
    
    <table class="table">
      <tr>
        <th>Order Number</th>
        <td>${order.orderNumber}</td>
      </tr>
      <tr>
        <th>Order Date</th>
        <td>${new Date(order.orderDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>Expected Delivery</th>
        <td>${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'TBD'}</td>
      </tr>
    </table>
    
    <h3>Order Items</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${order.lines.map((line: any) => `
          <tr>
            <td>${line.product?.name || line.description}</td>
            <td>${line.quantity}</td>
            <td>$${(line.quantity * line.unitPrice).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p style="text-align: right; font-size: 18px; margin-top: 20px;">
      <strong>Total: $${order.total.toFixed(2)}</strong>
    </p>
    
    <p style="margin-top: 30px;">
      <a href="#" class="button">Track Order</a>
    </p>
  `;

  return {
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: wrapEmailContent(content),
    text: `Order Confirmed: ${order.orderNumber}\nTotal: $${order.total}`,
  };
}

// Quotation Sent
export function quotationSentEmail(quotation: any): EmailTemplate {
  const content = `
    <h2>Quotation for Your Review</h2>
    <p>Dear ${quotation.customer?.name},</p>
    <p>Please find below our quotation for your consideration.</p>
    
    <table class="table">
      <tr>
        <th>Quotation Number</th>
        <td>${quotation.quotationNumber}</td>
      </tr>
      <tr>
        <th>Valid Until</th>
        <td>${new Date(quotation.validUntil).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>Total Amount</th>
        <td><strong>$${quotation.total.toFixed(2)}</strong></td>
      </tr>
    </table>
    
    <p style="margin-top: 30px;">
      <a href="#" class="button">View Quotation</a>
      <a href="#" class="button" style="background: #059669; margin-left: 10px;">Accept Quote</a>
    </p>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This quotation is valid until ${new Date(quotation.validUntil).toLocaleDateString()}.
    </p>
  `;

  return {
    subject: `Quotation ${quotation.quotationNumber}`,
    html: wrapEmailContent(content),
    text: `Quotation: ${quotation.quotationNumber}\nAmount: $${quotation.total}`,
  };
}

// Leave Request Submitted
export function leaveRequestEmail(leaveRequest: any): EmailTemplate {
  const content = `
    <h2>Leave Request Submitted</h2>
    <p>A leave request has been submitted and requires your approval.</p>
    
    <table class="table">
      <tr>
        <th>Employee</th>
        <td>${leaveRequest.employee?.firstName} ${leaveRequest.employee?.lastName}</td>
      </tr>
      <tr>
        <th>Leave Type</th>
        <td>${leaveRequest.leaveType}</td>
      </tr>
      <tr>
        <th>Start Date</th>
        <td>${new Date(leaveRequest.startDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>End Date</th>
        <td>${new Date(leaveRequest.endDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>Reason</th>
        <td>${leaveRequest.reason}</td>
      </tr>
    </table>
    
    <p style="margin-top: 30px;">
      <a href="#" class="button" style="background: #059669;">Approve</a>
      <a href="#" class="button" style="background: #dc2626; margin-left: 10px;">Reject</a>
    </p>
  `;

  return {
    subject: `Leave Request - ${leaveRequest.employee?.firstName} ${leaveRequest.employee?.lastName}`,
    html: wrapEmailContent(content),
    text: `Leave Request from ${leaveRequest.employee?.firstName}\nDates: ${leaveRequest.startDate} to ${leaveRequest.endDate}`,
  };
}

// Low Stock Alert
export function lowStockAlertEmail(product: any): EmailTemplate {
  const content = `
    <h2>⚠️ Low Stock Alert</h2>
    <p>The following product is running low on stock and needs to be reordered.</p>
    
    <table class="table">
      <tr>
        <th>Product</th>
        <td>${product.name}</td>
      </tr>
      <tr>
        <th>SKU</th>
        <td>${product.sku}</td>
      </tr>
      <tr>
        <th>Current Stock</th>
        <td style="color: #dc2626; font-weight: bold;">${product.qtyAvailable}</td>
      </tr>
      <tr>
        <th>Reorder Level</th>
        <td>${product.reorderLevel || 'Not set'}</td>
      </tr>
    </table>
    
    <p style="margin-top: 30px;">
      <a href="#" class="button">Create Purchase Order</a>
    </p>
  `;

  return {
    subject: `🔔 Low Stock Alert: ${product.name}`,
    html: wrapEmailContent(content),
    text: `Low Stock: ${product.name}\nCurrent: ${product.qtyAvailable}`,
  };
}

// Welcome Email
export function welcomeEmail(user: any): EmailTemplate {
  const content = `
    <h2>Welcome to Your Company ERP!</h2>
    <p>Hello ${user.firstName},</p>
    <p>Your account has been successfully created. We're excited to have you on board!</p>
    
    <table class="table">
      <tr>
        <th>Username</th>
        <td>${user.email}</td>
      </tr>
      <tr>
        <th>Role</th>
        <td>${user.role || 'User'}</td>
      </tr>
    </table>
    
    <p style="margin-top: 30px;">
      <a href="#" class="button">Login to Dashboard</a>
    </p>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      If you have any questions, please don't hesitate to contact our support team.
    </p>
  `;

  return {
    subject: 'Welcome to Your Company ERP',
    html: wrapEmailContent(content),
    text: `Welcome ${user.firstName}!\nYour ERP account is ready.`,
  };
}

// Password Reset
export function passwordResetEmail(user: any, resetToken: string): EmailTemplate {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${user.firstName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    
    <p style="margin-top: 30px;">
      <a href="#/reset-password?token=${resetToken}" class="button">Reset Password</a>
    </p>
    
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This link will expire in 1 hour. If you didn't request this, please ignore this email.
    </p>
  `;

  return {
    subject: 'Password Reset Request',
    html: wrapEmailContent(content),
    text: `Reset your password using this token: ${resetToken}`,
  };
}

// Helper function to send email (would integrate with actual email service)
export async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  console.log('Sending email to:', to);
  console.log('Subject:', template.subject);
  console.log('Would integrate with SendGrid/Resend/etc.');
  
  // TODO: Integrate with actual email service
  // Example with SendGrid:
  // await sgMail.send({
  //   to,
  //   from: 'noreply@yourcompany.com',
  //   subject: template.subject,
  //   html: template.html,
  //   text: template.text,
  // });
  
  return true;
}
