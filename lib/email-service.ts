import nodemailer from "nodemailer";

export const emailService = {
  async sendDeliveryEmail(passengerName: string, passengerEmail: string, rewardName: string) {
    const subject = "Congratulations! Your MUVA Reward Has Been Delivered";
    
    // MUVA Branded HTML Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #F8FAFC;
            color: #111827;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header {
            background-color: #111827;
            padding: 32px;
            text-align: center;
            border-bottom: 4px solid #0F8A5F;
          }
          .logo {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.05em;
            margin: 0;
          }
          .logo span {
            color: #22C55E;
          }
          .content {
            padding: 40px 32px;
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
            color: #111827;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #4B5563;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .reward-box {
            background-color: #F0FDF4;
            border: 1px solid #DCFCE7;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
          }
          .reward-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #15803D;
            margin-bottom: 4px;
          }
          .reward-name {
            font-size: 20px;
            font-weight: 800;
            color: #166534;
            margin: 0;
          }
          .footer {
            background-color: #F8FAFC;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #E2E8F0;
            font-size: 12px;
            color: #9CA3AF;
          }
          .footer a {
            color: #0F8A5F;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="logo">MUVA<span>MOBILITY</span></h2>
          </div>
          
          <div class="content">
            <h1>Hello ${passengerName},</h1>
            <p>Congratulations! Your requested reward has been successfully approved and delivered by the MUVA Team.</p>
            
            <div class="reward-box">
              <div class="reward-label">Your Delivered Reward</div>
              <h3 class="reward-name">${rewardName}</h3>
            </div>
            
            <p>Thank you for riding with MUVA Mobility. Every trip brings you closer to more rewards!</p>
            <p>Keep riding with MUVA for affordable, reliable, and rewarding transportation in Katsina State and beyond.</p>
            <p>We appreciate your loyalty.</p>
            
            <p style="margin-bottom: 0; font-weight: 600;">The MUVA Mobility Team</p>
          </div>
          
          <div class="footer">
            <p>Sent by MUVA Mobility • Katsina State Operations</p>
            <p><a href="http://www.muvamobility.com">www.muvamobility.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || "no-reply@muvamobility.com";

    if (host && user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        await transporter.sendMail({
          from,
          to: passengerEmail,
          subject,
          html,
        });

        console.log(`[Email Service] Branded email successfully sent to ${passengerEmail}`);
      } catch (error) {
        console.error("[Email Service] Failed to send email via SMTP, falling back to log", error);
        this.logFallback(passengerName, passengerEmail, rewardName, subject);
      }
    } else {
      this.logFallback(passengerName, passengerEmail, rewardName, subject);
    }
  },

  logFallback(name: string, email: string, reward: string, subject: string) {
    console.log("==============================================================================");
    console.log(`[MOCK EMAIL SENT]`);
    console.log(`To: ${name} <${email}>`);
    console.log(`Subject: ${subject}`);
    console.log(`Delivered Item: ${reward}`);
    console.log(`Body template initialized with MUVA Mobility branding.`);
    console.log("==============================================================================");
  }
};
