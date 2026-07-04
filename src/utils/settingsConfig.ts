// Keys for localStorage
const LS_TAX_RATE_KEY = 'brewmaster_tax_rate';
const LS_ADMIN_CREDS_KEY = 'brewmaster_admin_creds';

export function getTaxRate(): number {
  const saved = localStorage.getItem(LS_TAX_RATE_KEY);
  if (saved !== null) {
    const rate = parseFloat(saved);
    if (!isNaN(rate)) return rate;
  }
  return 0.1; // Default to 10%
}

export function setTaxRate(rate: number): void {
  localStorage.setItem(LS_TAX_RATE_KEY, rate.toString());
}

export function getAdminCredentials() {
  const saved = localStorage.getItem(LS_ADMIN_CREDS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.username && parsed.password) {
        return parsed;
      }
    } catch {
      // JSON parse error, ignore and fallback
    }
  }
  return { username: 'admin', password: '123' }; // Default credentials
}

export function setAdminCredentials(username: string, password: string): void {
  localStorage.setItem(LS_ADMIN_CREDS_KEY, JSON.stringify({ username, password }));
}
