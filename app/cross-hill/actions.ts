"use server";

import { sendPrayerToTelegram, sendAdminLoginAlert } from '../actions/telegram';

// 십자가 언덕에서 사용할 서버 함수 re-export
export { sendPrayerToTelegram };
