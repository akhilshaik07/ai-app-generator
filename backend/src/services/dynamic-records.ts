import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DynamicRecordInput {
  appId: string;
  entityName: string;
  userId: string;
  data: Record<string, any>;
}

export interface GetDynamicRecordsOptions {
  appId: string;
  entityName: string;
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  searchableFields?: string[];
  sort?: string;
  order?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Flatten a dynamic_records row so the frontend receives fields at the top level.
 *
 * Input  : { id, app_id, entity_name, user_id, data: { name, email }, created_at, updated_at }
 * Output : { id, name, email, created_at, updated_at }
 */
function flattenRecord(row: any): Record<string, any> {
  if (!row) return row;
  const { app_id, entity_name, user_id, data, ...meta } = row;
  return {
    ...meta,          // id, created_at, updated_at
    ...(data || {}),  // actual entity fields (name, email, phone, …)
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Insert a new dynamic record.
 * Always requires userId — every record must belong to an authenticated user.
 */
export async function createDynamicRecord(input: DynamicRecordInput): Promise<any> {
  const { appId, entityName, userId, data } = input;

  const payload = {
    app_id: appId,
    entity_name: entityName,
    user_id: userId,
    data,
  };

  const { data: inserted, error } = await supabase
    .from("dynamic_records")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[dynamic-records] createDynamicRecord error:", error);
    throw error;
  }

  return flattenRecord(inserted);
}

/**
 * Fetch a paginated, searchable, sortable list of dynamic records.
 * Always filters by user_id, app_id, and entity_name.
 */
export async function getDynamicRecords(
  opts: GetDynamicRecordsOptions
): Promise<{ records: any[]; total: number }> {
  const {
    appId,
    entityName,
    userId,
    page = 1,
    limit = 20,
    search,
    searchableFields = [],
    sort,
    order,
  } = opts;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("dynamic_records")
    .select("*", { count: "exact" })
    .eq("app_id", appId)
    .eq("entity_name", entityName)
    .eq("user_id", userId);

  // Sorting — sort by data->>field when the column isn't a meta column
  const metaColumns = ["id", "created_at", "updated_at", "app_id", "entity_name", "user_id"];
  if (sort) {
    if (metaColumns.includes(sort)) {
      query = query.order(sort, { ascending: order !== "desc" });
    } else {
      // Sort by JSONB field: data->>fieldName
      query = query.order(`data->${sort}`, { ascending: order !== "desc" } as any);
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[dynamic-records] getDynamicRecords error:", error);
    throw error;
  }

  let records = (data || []).map(flattenRecord);

  // Client-side search across JSONB data fields
  if (search && searchableFields.length > 0) {
    const lower = search.toLowerCase();
    records = records.filter((r) =>
      searchableFields.some((f) =>
        String(r[f] || "")
          .toLowerCase()
          .includes(lower)
      )
    );
  }

  return { records, total: count || 0 };
}

/**
 * Fetch a single dynamic record by id.
 * Always filters by user_id.
 */
export async function getSingleDynamicRecord(
  id: string,
  userId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from("dynamic_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    console.error("[dynamic-records] getSingleDynamicRecord error:", error);
    throw error;
  }

  return flattenRecord(data);
}

/**
 * Update a dynamic record's data.
 * Always filters by user_id to prevent cross-user access.
 */
export async function updateDynamicRecord(
  id: string,
  updatedData: Record<string, any>,
  userId: string
): Promise<any | null> {
  // First fetch the existing record to merge data
  const { data: existing, error: fetchError } = await supabase
    .from("dynamic_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") return null; // not found
    console.error("[dynamic-records] updateDynamicRecord fetch error:", fetchError);
    throw fetchError;
  }

  const mergedData = { ...(existing.data || {}), ...updatedData };

  const { data: updated, error: updateError } = await supabase
    .from("dynamic_records")
    .update({
      data: mergedData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("[dynamic-records] updateDynamicRecord error:", updateError);
    throw updateError;
  }

  return flattenRecord(updated);
}

/**
 * Delete a dynamic record by id.
 * Always filters by user_id to prevent cross-user access.
 */
export async function deleteDynamicRecord(
  id: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("dynamic_records")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[dynamic-records] deleteDynamicRecord error:", error);
    throw error;
  }
}

/**
 * Batch-insert multiple dynamic records (used by CSV import & form submissions).
 * Always requires userId — every record must belong to an authenticated user.
 */
export async function batchCreateDynamicRecords(
  appId: string,
  entityName: string,
  rows: Record<string, any>[],
  userId: string
): Promise<any[]> {
  if (rows.length === 0) return [];

  const payloads = rows.map((row) => ({
    app_id: appId,
    entity_name: entityName,
    user_id: userId,
    data: row,
  }));

  const { data, error } = await supabase
    .from("dynamic_records")
    .insert(payloads)
    .select();

  if (error) {
    console.error("[dynamic-records] batchCreateDynamicRecords error:", error);
    throw error;
  }

  return (data || []).map(flattenRecord);
}
