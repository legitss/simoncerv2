import { OfficerUser } from '../types';
import { syncOfficerToAuthAccount } from '../utils/auth';

export const DEFAULT_OFFICERS: OfficerUser[] = [
  {
    id: 'OFFICER-001',
    name: 'apt. Bambang Wicaksono, M.Biomed',
    nip: '198004122005011002',
    position: 'Pengawas Farmasi & Makanan Ahli Madya / Lead Auditor CPOB',
    phone: '+62 812-7788-9911',
    email: 'bambang.wicaksono@pom.go.id',
    username: 'bambang',
    hasLoginAccount: true,
  },
  {
    id: 'OFFICER-002',
    name: 'apt. Tri Wahyuni, M.Sc',
    nip: '198108142005012003',
    position: 'Subkoordinator Pengawasan Fasyankes & Evaluator CAPA',
    phone: '+62 813-8899-2233',
    email: 'tri.wahyuni@pom.go.id',
    username: 'petugas',
    hasLoginAccount: true,
  },
  {
    id: 'OFFICER-003',
    name: 'apt. Eko Prasetyo, M.Farm',
    nip: '197906152003121001',
    position: 'Auditor Distribusi CDOB & Verifikator CAPA Rantai Dingin',
    phone: '+62 811-2233-4455',
    email: 'eko.prasetyo@pom.go.id',
    username: 'eko',
    hasLoginAccount: true,
  },
  {
    id: 'OFFICER-004',
    name: 'Wahyu Hidayat, S.Si',
    nip: '198305122006041003',
    position: 'Pengawas Industri Pangan Olahan & Verifikator CPPOB',
    phone: '+62 815-6677-8899',
    email: 'wahyu.hidayat@pom.go.id',
    username: 'wahyu',
    hasLoginAccount: true,
  },
  {
    id: 'OFFICER-005',
    name: 'dr. Hendro Purwanto',
    nip: '197503112002121004',
    position: 'Kepala Seksi Pelayanan Kesehatan & Auditor Limbah B3',
    phone: '+62 818-5566-7788',
    email: 'hendro.purwanto@dinkes.go.id',
    username: 'hendro',
    hasLoginAccount: true,
  },
  {
    id: 'OFFICER-006',
    name: 'apt. Sri Mulyani, S.Si',
    nip: '197906152003122002',
    position: 'Subkoordinator Pengawasan NPP & Verifikator SIPNAP',
    phone: '+62 812-9911-3344',
    email: 'sri.mulyani@pom.go.id',
    username: 'srimulyani',
    hasLoginAccount: true,
  },
  {
    id: 'OFFICER-007',
    name: 'Dr. apt. Hendrawan Kusuma, M.Si',
    nip: '197405121999031002',
    position: 'Direktur / Pengawas Madya Inspeksi Khusus',
    phone: '+62 811-9988-7711',
    email: 'hendrawan.kusuma@pom.go.id',
    username: 'supervisor',
    hasLoginAccount: true,
  },
];

export const REGISTERED_OFFICERS: OfficerUser[] = DEFAULT_OFFICERS;

const OFFICERS_STORAGE_KEY = 'simoncer_registered_officers_v1';
const ACCOUNTS_STORAGE_KEY = 'simoncer_auth_accounts_v1';

export function getStoredOfficers(): OfficerUser[] {
  let officers: OfficerUser[] = [...DEFAULT_OFFICERS];

  try {
    const raw = localStorage.getItem(OFFICERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        officers = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load officers from localStorage', e);
  }

  // AUTO-SYNC: Merge any PETUGAS_EVALUATOR accounts from auth accounts into directory
  try {
    const accountsRaw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (accountsRaw) {
      const accounts = JSON.parse(accountsRaw);
      if (Array.isArray(accounts)) {
        const evaluators = accounts.filter((a: any) => a.role === 'PETUGAS_EVALUATOR');
        let hasNew = false;

        evaluators.forEach((ev: any) => {
          const normName = ev.name.toLowerCase().trim();
          const matchIndex = officers.findIndex(
            (o) =>
              o.id === ev.id ||
              (o.nip && ev.nip && o.nip.trim() === ev.nip.trim()) ||
              o.name.toLowerCase().trim() === normName
          );

          if (matchIndex === -1) {
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
            hasNew = true;
          } else {
            if (!officers[matchIndex].username || officers[matchIndex].username !== ev.username) {
              officers[matchIndex].username = ev.username;
              officers[matchIndex].hasLoginAccount = true;
            }
          }
        });

        if (hasNew) {
          localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(officers));
        }
      }
    }
  } catch (err) {
    console.error('Failed to sync evaluators into officers directory', err);
  }

  return officers;
}

export function saveStoredOfficers(officers: OfficerUser[]): void {
  try {
    localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(officers));
    window.dispatchEvent(new Event('simoncer-officers-updated'));
  } catch (e) {
    console.error('Failed to save officers to localStorage', e);
  }
}

export function addOfficer(officerData: Omit<OfficerUser, 'id'>, customUsername?: string, customPassword?: string): OfficerUser {
  const current = getStoredOfficers();
  const newOfficer: OfficerUser = {
    ...officerData,
    id: `OFFICER-${Date.now()}`,
    hasLoginAccount: true,
  };

  // AUTO-SYNC: Also create linked Auth Account so this officer can log in!
  const linkedAccount = syncOfficerToAuthAccount(newOfficer, customUsername, customPassword);
  newOfficer.username = linkedAccount.username;

  const updated = [newOfficer, ...current];
  saveStoredOfficers(updated);
  return newOfficer;
}

export function updateOfficer(id: string, updatedData: Partial<OfficerUser>): OfficerUser | null {
  const current = getStoredOfficers();
  const index = current.findIndex((o) => o.id === id);
  if (index === -1) return null;

  current[index] = {
    ...current[index],
    ...updatedData,
  };
  saveStoredOfficers(current);
  return current[index];
}

export function deleteOfficer(id: string): void {
  const current = getStoredOfficers();
  const updated = current.filter((o) => o.id !== id);
  saveStoredOfficers(updated.length > 0 ? updated : DEFAULT_OFFICERS);
}

export function getOfficerByName(name: string): OfficerUser | undefined {
  const officers = getStoredOfficers();
  return officers.find(
    (o) => o.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(o.name.toLowerCase())
  );
}

export function getDefaultOfficer(): OfficerUser {
  const officers = getStoredOfficers();
  return officers[0] || DEFAULT_OFFICERS[0];
}
