/**
 * sendToWhatsApp — dispatches form data via CallMeBot API
 *
 * Now accepts an optional `phoneOverride` so each user's contact section
 * can route messages to the portfolio owner's own WhatsApp number.
 *
 * Security note: CallMeBot only allows sending to YOUR own number.
 * The API key is tied to that number, so exposure risk is minimal.
 * For production, use WhatsApp Business Cloud API via a serverless function.
 */
export async function sendToWhatsApp({ name, email, message }, phoneOverride) {
  // Prefer dynamic user number, fall back to env var
  const phone = phoneOverride || import.meta.env.VITE_MY_WHATSAPP_NUMBER;
  const apiKey = import.meta.env.VITE_CALLMEBOT_API_KEY;

  // Sanitize inputs before sending
  const safeName = String(name).slice(0, 50).replace(/[<>]/g, '');
  const safeEmail = String(email).slice(0, 100).replace(/[<>]/g, '');
  const safeMessage = String(message).slice(0, 1000).replace(/[<>]/g, '');

  if (!phone || !apiKey) {
    // Dev fallback — log to console, simulate success
    console.info('[WhatsApp] ENV creds not configured. Simulating success.');
    console.table({ phone, name: safeName, email: safeEmail, message: safeMessage });
    await new Promise((r) => setTimeout(r, 800));
    return { success: true };
  }

  const text = encodeURIComponent(
    `🔔 NEW QUEST ACCEPTED — CodeAether Portfolio\n\n` +
    `👤 Name: ${safeName}\n` +
    `📧 Email: ${safeEmail}\n` +
    `💬 Message: ${safeMessage}\n\n` +
    `🌐 codeaether.vercel.com`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=${apiKey}`;

  try {
    await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (err) {
    console.error('[WhatsApp] Fetch failed:', err);
    return { success: false, error: err.message };
  }
}
