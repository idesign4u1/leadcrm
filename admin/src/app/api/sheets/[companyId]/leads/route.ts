import { NextRequest, NextResponse } from 'next/server';
import { guardCompanyAccess, isGuardError, corsHeaders } from '@/lib/sheets/auth-guard';
import { getSheetData, appendRow, ensureCrmColumns } from '@/lib/sheets/service';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/sheets/[companyId]/leads
// Returns headers + all lead rows from the connected sheet.
export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const guard = await guardCompanyAccess(req, params.companyId);
  if (isGuardError(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status, headers: corsHeaders });
  }

  try {
    const sheetData = await getSheetData(guard.spreadsheetId, guard.sheetName);

    // Attach rowIndex (sheet row number, 2-based) to each row for updates
    const leads = sheetData.rows.map((fields, i) => ({
      rowIndex: i + 2, // row 1 = headers, row 2 = first lead
      fields,
    }));

    return NextResponse.json(
      { headers: sheetData.headers, leads },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read sheet';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

// POST /api/sheets/[companyId]/leads
// Appends a new lead row. Body: { fields: Record<string, string> }
export async function POST(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const guard = await guardCompanyAccess(req, params.companyId);
  if (isGuardError(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status, headers: corsHeaders });
  }

  const body = await req.json() as { fields: Record<string, string> };
  if (!body?.fields) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: corsHeaders });
  }

  try {
    // Ensure CRM columns exist before appending
    const headers = await ensureCrmColumns(guard.spreadsheetId, guard.sheetName);

    // Auto-fill CRM metadata
    const now = new Date().toISOString();
    const fields: Record<string, string> = {
      ...body.fields,
      lead_id: body.fields.lead_id || randomUUID(),
      updated_at: now,
    };

    await appendRow(guard.spreadsheetId, guard.sheetName, fields, headers);

    // Log activity
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('activity_logs').insert({
      company_id: params.companyId,
      user_id: guard.userId,
      action: 'lead_created',
      entity_type: 'lead',
      metadata: { fields },
    });

    return NextResponse.json({ ok: true }, { status: 201, headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create lead';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
