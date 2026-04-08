/**
 * sendToWhatsApp — dispatches form data via CallMeBot API
 * Requires VITE_MY_WHATSAPP_NUMBER & VITE_CALLMEBOT_API_KEY in .env
 *
 * Security note: CallMeBot only allows sending to YOUR own number.
 * The API key is tied to that number, so exposure risk is minimal.
 * For production use WhatsApp Business Cloud API via a serverless function.
 */
export async function sendToWhatsApp({ name, email, message }) {
  const phone  = import.meta.env.VITE_MY_WHATSAPP_NUMBER;
  const apiKey = import.meta.env.VITE_CALLMEBOT_API_KEY;

  // Sanitize inputs before sending
  const safeName    = String(name).slice(0, 50).replace(/[<>]/g, '');
  const safeEmail   = String(email).slice(0, 100).replace(/[<>]/g, '');
  const safeMessage = String(message).slice(0, 1000).replace(/[<>]/g, '');

  if (!phone || !apiKey) {
    // Dev fallback — log to console, simulate success
    console.info('[WhatsApp] ENV creds not configured. Simulating success.');
    console.table({ name: safeName, email: safeEmail, message: safeMessage });
    await new Promise((r) => setTimeout(r, 800)); // fake delay
    return { success: true };
  }

  const text = encodeURIComponent(
    `🔔 NEW QUEST ACCEPTED — Portfolio\n\n` +
    `👤 Name: ${safeName}\n` +
    `📧 Email: ${safeEmail}\n` +
    `💬 Message: ${safeMessage}\n\n` +
    `🌐 antigravity.vercel.app`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (err) {
    console.error('[WhatsApp] Fetch failed:', err);
    return { success: false, error: err.message };
  }
}
