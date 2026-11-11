import { AuthAccount, OfficerUser, UserRole } from '../types';

export const DEFAULT_ACCOUNTS: AuthAccount[] = [
  {
    id: 'ACC-ADMIN-01',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator BBPOM',
    role: 'ADMIN',
    nip: '198205152006041001',
    position: 'Pranata Komputer & Administrator SIMONCER BBPOM',
    phone: '+62 812-3456-7890',
    email: 'admin.simoncer@pom.go.id',
    avatar: '👨‍💼',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-EVAL-01',
    username: 'bambang',
    password: 'petugas123',
    name: 'apt. Bambang Wicaksono, M.Biomed',
    role: 'PETUGAS_EVALUATOR',
    nip: '198004122005011002',
    position: 'Pengawas Farmasi & Makanan Ahli Madya / Lead Auditor CPOB',
    phone: '+62 812-7788-9911',
    email: 'bambang.wicaksono@pom.go.id',
    avatar: '👨‍🔬',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-EVAL-02',
    username: 'petugas',
    password: 'petugas123',
    name: 'apt. Tri Wahyuni, M.Sc',
    role: 'PETUGAS_EVALUATOR',
    nip: '198108142005012003',
    position: 'Subkoordinator Pengawasan Fasyankes & Evaluator CAPA',
    phone: '+62 813-8899-2233',
    email: 'tri.wahyuni@pom.go.id',
    avatar: '👩‍🔬',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-EVAL-03',
    username: 'eko',
    password: 'petugas123',
    name: 'apt. Eko Prasetyo, M.Farm',
    role: 'PETUGAS_EVALUATOR',
    nip: '197906152003121001',
    position: 'Auditor Distribusi CDOB & Verifikator CAPA Rantai Dingin',
    phone: '+62 811-2233-4455',
    email: 'eko.prasetyo@pom.go.id',
    avatar: '👨‍🔬',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-EVAL-04',
    username: 'wahyu',
    password: 'petugas123',
    name: 'Wahyu Hidayat, S.Si',
    role: 'PETUGAS_EVALUATOR',
    nip: '198305122006041003',
    position: 'Pengawas Industri Pangan Olahan & Verifikator CPPOB',
    phone: '+62 815-6677-8899',
    email: 'wahyu.hidayat@pom.go.id',
    avatar: '👨‍🔬',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-EVAL-05',
    username: 'hendro',
    password: 'petugas123',
    name: 'dr. Hendro Purwanto',
    role: 'PETUGAS_EVALUATOR',
    nip: '197503112002121004',
    position: 'Kepala Seksi Pelayanan Kesehatan & Auditor Limbah B3',
    phone: '+62 818-5566-7788',
    email: 'hendro.purwanto@dinkes.go.id',
    avatar: '👨‍⚕️',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-EVAL-06',
    username: 'srimulyani',
    password: 'petugas123',
    name: 'apt. Sri Mulyani, S.Si',
    role: 'PETUGAS_EVALUATOR',
    nip: '197906152003122002',
    position: 'Subkoordinator Pengawasan NPP & Verifikator SIPNAP',
    phone: '+62 812-9911-3344',
    email: 'sri.mulyani@pom.go.id',
    avatar: '👩‍🔬',
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ACC-SUPER-01',
    username: 'supervisor',
    password: 'super123',
    name: 'Dr. apt. Hendrawan Kusuma, M.Si',
    role: 'SUPERVISOR',
    nip: '197405121999031002',
    position: 'Kepala Balai Besar Pengawas Obat dan Makanan (Supervisor)',
    phone: '+62 811-9988-7711',
    email: 'hendrawan.kusuma@pom.go.id',
    avatar: '🎖️',
    createdAt: '2026-01-01T08:00:00Z',
  },
];

const ACCOUNTS_STORAGE_KEY = 'simoncer_auth_accounts_v1';
const CURRENT_USER_KEY = 'simoncer_active_user_v1';
const OFFICERS_STORAGE_KEY = 'simoncer_registered_officers_v1';

export function getStoredAccounts(): AuthAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read accounts from localStorage', err);
  }
  return [...DEFAULT_ACCOUNTS];
}

export function saveStoredAccounts(accounts: AuthAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new Event('simoncer-accounts-updated'));
  } catch (err) {
    console.error('Failed to save accounts to localStorage', err);
  }
}

export function getCurrentUser(): AuthAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCurrentUser(account: AuthAccount | null): void {
  try {
    if (account) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    window.dispatchEvent(new Event('simoncer-auth-changed'));
  } catch {
    // ignore
  }
}

export function authenticate(usernameOrNip: string, password: string): { success: boolean; account?: AuthAccount; message?: string } {
  const accounts = getStoredAccounts();
  const cleanedQuery = usernameOrNip.trim().toLowerCase();
  
  const found = accounts.find(
    (acc) =>
      acc.username.toLowerCase() === cleanedQuery ||
      (acc.nip && acc.nip.replace(/\s+/g, '') === cleanedQuery.replace(/\s+/g, '')) ||
      (acc.email && acc.email.toLowerCase() === cleanedQuery)
  );

  if (!found) {
    return { success: false, message: 'Nama pengguna, NIP, atau email tidak ditemukan dalam pangkalan data!' };
  }

  if (found.password && found.password !== password) {
    return { success: false, message: 'Kata sandi tidak sesuai! Silakan periksa kembali.' };
  }

  return { success: true, account: found };
}

export function registerAccount(accountData: Omit<AuthAccount, 'id' | 'createdAt'>): { success: boolean; account?: AuthAccount; message?: string } {
  const accounts = getStoredAccounts();
  const usernameClean = accountData.username.trim().toLowerCase();

  const exists = accounts.some((a) => a.username.toLowerCase() === usernameClean);
  if (exists) {
    return { success: false, message: `Username "${accountData.username}" sudah digunakan!` };
  }

  const newAccount: AuthAccount = {
    ...accountData,
    id: `ACC-${Date.now()}`,
    createdAt: new Date().toISOString(),
    avatar: accountData.role === 'SUPERVISOR' ? '🎖️' : accountData.role === 'ADMIN' ? '👨‍💼' : '👨‍🔬',
  };

  const updated = [newAccount, ...accounts];
  saveStoredAccounts(updated);

  // AUTO-SYNC: If created as PETUGAS_EVALUATOR, automatically add/sync to Officer Directory!
  if (newAccount.role === 'PETUGAS_EVALUATOR') {
    syncAccountToOfficerDirectory(newAccount);
  }

  return { success: true, account: newAccount };
}

export function deleteAccount(id: string): boolean {
  const accounts = getStoredAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  if (filtered.length === accounts.length) return false;
  saveStoredAccounts(filtered.length > 0 ? filtered : DEFAULT_ACCOUNTS);
  return true;
}

/**
 * AUTO-SYNC: Whenever an evaluator account is created/updated,
 * automatically ensure they exist in the Officer Directory for PIC assignment.
 */
export function syncAccountToOfficerDirectory(account: AuthAccount): void {
  try {
    const raw = localStorage.getItem(OFFICERS_STORAGE_KEY);
    let officers: OfficerUser[] = [];
    if (raw) {
      try {
        officers = JSON.parse(raw);
      } catch {}
    }

    const normName = account.name.toLowerCase().trim();
    const existingIndex = officers.findIndex(
      (o) =>
        o.id === account.id ||
        (o.nip && account.nip && o.nip.trim() === account.nip.trim()) ||
        o.name.toLowerCase().trim() === normName
    );

    if (existingIndex !== -1) {
      officers[existingIndex] = {
        ...officers[existingIndex],
        name: account.name,
        nip: account.nip || officers[existingIndex].nip,
        position: account.position || officers[existingIndex].position,
        phone: account.phone || officers[existingIndex].phone,
        email: account.email || officers[existingIndex].email,
        username: account.username,
        hasLoginAccount: true,
      };
    } else {
      const newOfficer: OfficerUser = {
        id: account.id || `OFFICER-${Date.now()}`,
        name: account.name,
        nip: account.nip || '198500000000000000',
        position: account.position || 'Pengawas Farmasi & Makanan / Evaluator CAPA',
        phone: account.phone || '+62 812-0000-0000',
        email: account.email || `${account.username}@pom.go.id`,
        username: account.username,
        hasLoginAccount: true,
      };
      officers.unshift(newOfficer);
    }

    localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(officers));
    window.dispatchEvent(new Event('simoncer-officers-updated'));
  } catch (e) {
    console.error('Failed to sync account to officer directory', e);
  }
}

/**
 * AUTO-SYNC: Whenever an officer is created in the Officer Directory,
 * automatically create/link their login account (username & password).
 */
export function syncOfficerToAuthAccount(
  officer: OfficerUser,
  customUsername?: string,
  customPassword?: string
): AuthAccount {
  const accounts = getStoredAccounts();
  const normName = officer.name.toLowerCase().trim();

  const existing = accounts.find(
    (a) =>
      a.id === officer.id ||
      (a.nip && officer.nip && a.nip.trim() === officer.nip.trim()) ||
      a.name.toLowerCase().trim() === normName
  );

  if (existing) {
    return existing;
  }

  // Generate clean unique username
  const baseUsername =
    customUsername ||
    officer.name
      .toLowerCase()
      .replace(/apt\.|dr\.|dra\.|m\.si|m\.farm|s\.si|s\.farm|m\.sc|m\.biomed/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12) ||
    `petugas${Math.floor(100 + Math.random() * 900)}`;

  let finalUsername = baseUsername;
  let counter = 1;
  while (accounts.some((a) => a.username.toLowerCase() === finalUsername.toLowerCase())) {
    finalUsername = `${baseUsername}${counter}`;
    counter++;
  }

  const newAcc: AuthAccount = {
    id: `ACC-EVAL-${Date.now()}`,
    username: finalUsername,
    password: customPassword || 'petugas123',
    name: officer.name,
    role: 'PETUGAS_EVALUATOR',
    nip: officer.nip,
    position: officer.position,
    phone: officer.phone,
    email: officer.email,
    avatar: '👨‍🔬',
    createdAt: new Date().toISOString(),
  };

  const nextList = [newAcc, ...accounts];
  saveStoredAccounts(nextList);
  return newAcc;
}

/**
 * Perform a full two-way integrity sync between Auth Accounts and Officers Directory.
 */
export function syncAllAccountsAndOfficers(): void {
  try {
    const accounts = getStoredAccounts();
    const evaluators = accounts.filter((a) => a.role === 'PETUGAS_EVALUATOR');

    const raw = localStorage.getItem(OFFICERS_STORAGE_KEY);
    let officers: OfficerUser[] = [];
    if (raw) {
      try {
        officers = JSON.parse(raw);
      } catch {}
    }

    let modified = false;

    // 1. Ensure all evaluator accounts exist in officers directory
    evaluators.forEach((ev) => {
      const match = officers.find(
        (o) =>
          o.id === ev.id ||
          (o.nip && ev.nip && o.nip.trim() === ev.nip.trim()) ||
          o.name.toLowerCase().trim() === ev.name.toLowerCase().trim()
      );

      if (!match) {
        officers.unshift({
          id: ev.id,
          name: ev.name,
          nip: ev.nip || '198500000000000000',
          position: ev.position || 'Pengawas Farmasi & Makanan / Evaluator CAPA',
          phone: ev.phone || '+62 812-0000-0000',
          email: ev.email || `${ev.username}@pom.go.id`,
          username: ev.username,
          hasLoginAccount: true,
        });
        modified = true;
      } else {
        if (!match.username || match.username !== ev.username || !match.hasLoginAccount) {
          match.username = ev.username;
          match.hasLoginAccount = true;
          modified = true;
        }
      }
    });

    if (modified) {
      localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(officers));
      window.dispatchEvent(new Event('simoncer-officers-updated'));
    }
  } catch (err) {
    console.error('Error during full sync of accounts and officers', err);
  }
}
