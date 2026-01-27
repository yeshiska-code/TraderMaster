import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filters } = await req.json();

    // Build filter query
    const query = { user_id: user.id };
    
    if (filters?.account_id) query.account_id = filters.account_id;
    if (filters?.strategy_id) query.strategy_id = filters.strategy_id;
    if (filters?.status) query.status = filters.status;
    if (filters?.direction) query.direction = filters.direction;

    const trades = await base44.entities.Trade.filter(query, '-entry_time', 10000);

    // Build CSV
    const headers = [
      'ID', 'Date', 'Time', 'Symbol', 'Direction', 'Status', 
      'Entry Price', 'Exit Price', 'Quantity', 'Gross P&L', 'Commission', 
      'Fees', 'Net P&L', 'R-Multiple', 'Stop Loss', 'Take Profit',
      'Setup', 'Session', 'Quality', 'Followed Rules', 'Mistakes', 'Notes'
    ];

    const rows = trades.map(t => [
      t.id,
      t.entry_time ? new Date(t.entry_time).toISOString().split('T')[0] : '',
      t.entry_time ? new Date(t.entry_time).toISOString().split('T')[1].split('.')[0] : '',
      t.symbol || '',
      t.direction || '',
      t.status || '',
      t.entry_price || '',
      t.exit_price || '',
      t.quantity || '',
      t.gross_pnl || '',
      t.commission || '',
      t.fees || '',
      t.net_pnl || '',
      t.r_multiple || '',
      t.stop_loss || '',
      t.take_profit || '',
      t.setup_type || '',
      t.session || '',
      t.trade_quality || '',
      t.followed_rules ? 'Yes' : 'No',
      (t.mistakes || []).join('; '),
      (t.notes || '').replace(/"/g, '""') // Escape quotes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trades_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting trades:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});