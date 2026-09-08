export const SHOP_NAME = 'संकेत गोयल मुकेश कुमार सर्राफ';
export const APP_VERSION = '1';

// Money-lending registration number under the UP Regulation of Money-Lending
// Act 1976. Required on loan documents and receipts (s.13). Set from the
// गिरवी screen; stored on the device, not in this file.
export const REGISTRATION_KEY = 'sarafa.registrationNo';

export function getRegistrationNo() {
  try { return localStorage.getItem(REGISTRATION_KEY) || ''; } catch { return ''; }
}

export function setRegistrationNo(value) {
  try { localStorage.setItem(REGISTRATION_KEY, value); } catch { /* ignore */ }
}
