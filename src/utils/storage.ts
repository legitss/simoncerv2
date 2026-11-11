import { InspectionSession, SystemNotification, AuditTrailLog, EvidenceFile } from '../types';
import { INITIAL_INSPECTIONS } from '../data/mockData';

const STORAGE_KEY = 'simoncer_inspections_data_v3';

export function sanitizeInspection(inspection: InspectionSession): InspectionSession {
  if (!inspection || !Array.isArray(inspection.findings)) return inspection;

  const sanitizedFindings = inspection.findings.map((f, fIdx) => {
    if (!f.capa || !Array.isArray(f.capa.evidenceFiles)) return f;

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueFiles: EvidenceFile[] = [];

    for (const ev of f.capa.evidenceFiles) {
      if (!ev) continue;
      const cleanId = ev.id || `EV-${f.id || fIdx}-${Math.random().toString(36).slice(2, 7)}`;
      const cleanName = (ev.name || '').trim().toLowerCase();

      // Skip duplicate IDs or duplicate file names within the same finding
      if (seenIds.has(cleanId) || (cleanName && seenNames.has(cleanName))) {
        continue;
      }
      seenIds.add(cleanId);
      if (cleanName) seenNames.add(cleanName);

      uniqueFiles.push({
        ...ev,
        id: cleanId,
      });
    }

    return {
      ...f,
      capa: {
        ...f.capa,
        evidenceFiles: uniqueFiles,
      },
    };
  });

  return {
    ...inspection,
    findings: sanitizedFindings,
  };
}

export function loadInspections(): InspectionSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sanitized = INITIAL_INSPECTIONS.map(sanitizeInspection);
      saveInspections(sanitized);
      return sanitized;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const sanitized = INITIAL_INSPECTIONS.map(sanitizeInspection);
      saveInspections(sanitized);
      return sanitized;
    }
    return parsed.map(sanitizeInspection);
  } catch (err) {
    console.error('Failed to load inspections from storage', err);
    return INITIAL_INSPECTIONS.map(sanitizeInspection);
  }
}

export function saveInspections(data: InspectionSession[]): void {
  try {
    const sanitized = data.map(sanitizeInspection);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save inspections to storage', err);
  }
}

export function resetInspectionsToDefault(): InspectionSession[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    saveInspections(INITIAL_INSPECTIONS);
    return INITIAL_INSPECTIONS;
  } catch {
    return INITIAL_INSPECTIONS;
  }
}

export function createAuditLog(
  action: string,
  actor: string,
  role: 'Petugas' | 'Sarana' | 'Evaluator' | 'Admin' | 'Sistem',
  details: string,
  badgeType: 'info' | 'success' | 'warning' | 'purple' | 'danger' = 'info'
): AuditTrailLog {
  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    actor,
    role,
    timestamp: new Date().toISOString(),
    details,
    badgeType,
  };
}

export function createNotification(
  channel: 'WHATSAPP' | 'EMAIL',
  recipient: string,
  subject: string,
  content: string,
  triggerEvent: SystemNotification['triggerEvent']
): SystemNotification {
  return {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    channel,
    recipient,
    subject,
    content,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED',
    triggerEvent,
  };
}
