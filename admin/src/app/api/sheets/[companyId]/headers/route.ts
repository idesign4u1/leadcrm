import { NextRequest, NextResponse } from 'next/server';
import { guardCompanyAccess, isGuardError, corsHeaders } from '@/lib/sheets/auth-guard';
import { ensureCrmColumns } from '@/lib/sheets/service';
import { createClient } from '@supabase/supabase-js';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/sheets/[companyId]/headers
// Returns sheet headers, auto-creating CRM columns if missing.
// Also caches headers in sheet_connections.
export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const guard = await guardCompanyAccess(req, params.companyId);
  if (isGuardError(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status, headers: corsHeaders });
  }

  try {
    const headers = await ensureCrmColumns(guard.spreadsheetId, guard.sheetName);

    // Cache headers + update last_synced_at
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase
      .from('sheet_connections')
      .update({ cached_headers: headers, last_synced_at: new Date().toISOString() })
      .eq('company_id', params.companyId);

    return NextResponse.json({ headers }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read headers';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
