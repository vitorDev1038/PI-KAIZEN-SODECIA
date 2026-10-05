import { supabase } from './supabase';
import type { Department } from './database.types';

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dep-001', name: 'Prensa & Estamparia', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-002', name: 'Solda & Armação (Body in White)', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-003', name: 'Montagem & Pintura', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-004', name: 'Logística & Almoxarifado', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-005', name: 'Engenharia & Manutenção', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-006', name: 'Qualidade & Laboratório', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-007', name: 'Segurança & Meio Ambiente (EHS)', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-008', name: 'Administrativo & RH', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-009', name: 'Tecnologia da Informação (TI)', company: 'Sodecia', created_at: new Date().toISOString() },
  { id: 'dep-010', name: 'Geral / Outros', company: 'Sodecia', created_at: new Date().toISOString() },
];

/**
 * Fetches departments from DB. If empty or table doesn't exist, returns default Sodecia departments
 * and attempts to seed them in Supabase DB if possible.
 */
export async function getOrSeedDepartments(): Promise<Department[]> {
  try {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (!error && data && data.length > 0) {
      return data as Department[];
    }

    // Try to seed default departments into DB
    try {
      const seedItems = DEFAULT_DEPARTMENTS.map(({ name, company }) => ({ name, company: company || 'Sodecia' }));
      const { data: insertedData, error: insertError } = await supabase
        .from('departments')
        .insert(seedItems)
        .select();

      if (!insertError && insertedData && insertedData.length > 0) {
        return insertedData as Department[];
      }
    } catch {
      // If insertion fails (e.g. table doesn't exist or RLS), return fallback defaults
    }

    return DEFAULT_DEPARTMENTS;
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

/**
 * Ensures that a selected department ID is valid.
 * If the user selected a fallback department (e.g. 'dep-001'), tries to find or create the department in DB
 * and return its real UUID, or null if the DB table doesn't exist.
 */
export async function resolveDepartmentId(selectedId: string, departmentsList: Department[]): Promise<string | null> {
  if (!selectedId) return null;

  // Check if selectedId is already a valid UUID (36 chars)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedId);
  if (isUUID) {
    return selectedId;
  }

  // It's a fallback ID (e.g., 'dep-001')
  const matchedDep = departmentsList.find((d) => d.id === selectedId);
  if (!matchedDep) return null;

  try {
    // Check if a department with this name exists in DB
    const { data: existing } = await supabase
      .from('departments')
      .select('id')
      .eq('name', matchedDep.name)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    // Try to create it in DB
    const { data: created } = await supabase
      .from('departments')
      .insert({ name: matchedDep.name, company: matchedDep.company || 'Sodecia' })
      .select('id')
      .single();

    if (created?.id) {
      return created.id;
    }
  } catch {
    // If DB fails, return null
  }

  return null;
}
