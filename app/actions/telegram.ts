"use server";

export async function sendTelegramAlert(text: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("서버 환경변수에 TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 없습니다!");
    return { success: false };
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`);
    return { success: true };
  } catch (error) {
    console.error("텔레그램 발송 오류:", error);
    return { success: false };
  }
}

export async function sendPrayerToTelegram(prayer: string) {
  const text = `🙏 [십자가 언덕 누군가의 기도]\n\n"${prayer}"\n\n목사님, 기도가 필요합니다.`;
  return sendTelegramAlert(text);
}

export async function sendAdminLoginAlert() {
  const text = "🔔 [시스템 알림] 거제반석교회 관리자 모드에 접속했습니다.";
  return sendTelegramAlert(text);
}
