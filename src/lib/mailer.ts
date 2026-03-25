import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export async function sendPasswordEmail(to: string, password: string, isReset = false) {
  const subject = isReset
    ? "Карта воспитательной среды — новый пароль"
    : "Карта воспитательной среды — ваш пароль для входа";

  const action = isReset ? "Ваш новый пароль" : "Ваш пароль для входа";

  await resend.emails.send({
    from: "Карта воспитательной среды <onboarding@resend.dev>",
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 8px;">Карта воспитательной среды</h2>
        <p style="color: #6e6e8a; font-size: 14px; margin-bottom: 24px;">Инструмент самодиагностики для советников директора по воспитанию</p>
        <hr style="border: none; border-top: 1px solid #e2e2ea; margin-bottom: 24px;" />
        <p style="color: #1a1a2e; font-size: 15px; margin-bottom: 8px;">${action}:</p>
        <div style="background: #f0f0f5; border-radius: 10px; padding: 16px 20px; font-size: 22px; font-weight: 600; letter-spacing: 2px; color: #1a1a2e; text-align: center; margin-bottom: 24px;">
          ${password}
        </div>
        <p style="color: #6e6e8a; font-size: 13px;">Используйте этот пароль вместе с вашим email для входа в систему. Рекомендуем сохранить его в надёжном месте.</p>
      </div>
    `,
  });
}
