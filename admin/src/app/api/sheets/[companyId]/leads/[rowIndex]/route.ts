import { NextRequest, NextResponse } from 'next/server';
import { guardCompanyAccess, isGuardError, corsHeaders } from '@/lib/sheets/auth-guard';
import { getSheetData, updateRowFields } from '@/lib/sheets/service';
import { createClient } from '@supabase/supabase-js';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/sheets/[companyId]/leads/[rowIndex]
// Returns a single lead row by sheet row index.
export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string; rowIndex: string } }
) {
  const guard = await guardCompanyAccess(req, params.companyId);
  if (isGuardError(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status, headers: corsHeaders });
  }

  const rowIndex = parseInt(params.rowIndex, 10);
  if (isNaN(rowIndex) || rowIndex < 2) {
    return NextResponse.json({ error: 'Invalid rowIndex' }, { status: 400, headers: corsHeaders });
  }

  try {
    const { headers, rows } = await getSheetData(guard.spreadsheetId, guard.sheetName);
    const lead = rows[rowIndex - 2]; // rowIndex 2 → rows[0]
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ rowIndex, headers, fields: lead }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read lead';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

// PATCH /api/sheets/[companyId]/leads/[rowIndex]
// Updates specific fields of a lead row. Body: { fields: Record<string, string> }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { companyId: string; rowIndex: string } }
) {
  const guard = await guardCompanyAccess(req, params.companyId);
  if (isGuardError(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status, headers: corsHeaders });
  }

  const rowIndex = parseInt(params.rowIndex, 10);
  if (isNaN(rowIndex) || rowIndex < 2) {
    return NextResponse.json({ error: 'Invalid rowIndex' }, { status: 400, headers: corsHeaders });
  }

  const body = await req.json() as { fields: Record<string, string> };
  if (!body?.fields) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400, headers: corsHeaders });
  }

  try {
    const fields = {
      ...body.fields,
      updated_at: new Date().toISOString(),
    };

    await updateRowFields(guard.spreadsheetId, guard.sheetName, rowIndex, fields);

    // Log activity
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('activity_logs').insert({
      company_id: params.companyId,
      user_id: guard.userId,
      action: 'lead_updated',
      entity_type: 'lead',
      entity_id: String(rowIndex),
      metadata: { fields },
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lead';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
