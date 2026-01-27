import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const accountId = formData.get('account_id');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!accountId) {
      return Response.json({ error: 'account_id is required' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return Response.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const trades = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });

        // Map CSV columns to entity fields (flexible mapping)
        const tradeData = {
          user_id: user.id,
          account_id: accountId,
          source: 'import',
          symbol: row.Symbol || row.symbol,
          direction: (row.Direction || row.direction || '').toLowerCase(),
          entry_price: parseFloat(row['Entry Price'] || row.entry_price || 0),
          exit_price: parseFloat(row['Exit Price'] || row.exit_price || 0),
          quantity: parseFloat(row.Quantity || row.quantity || row.Size || 1),
          commission: parseFloat(row.Commission || row.commission || 0),
          fees: parseFloat(row.Fees || row.fees || 0),
          entry_time: row.Date && row.Time ? `${row.Date}T${row.Time}Z` : row['Entry Time'] || new Date().toISOString(),
          exit_time: row['Exit Time'] || (row.Date && row.Time ? `${row.Date}T${row.Time}Z` : null),
          status: (row.Status || row.status || 'closed').toLowerCase(),
          setup_type: row.Setup || row.setup_type,
          session: row.Session || row.session,
          notes: row.Notes || row.notes
        };

        // Validate required fields
        if (!tradeData.symbol || !tradeData.direction || !tradeData.entry_price || !tradeData.quantity) {
          errors.push({ row: i + 1, error: 'Missing required fields' });
          continue;
        }

        trades.push(tradeData);

      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    // Create trades in bulk
    const created = [];
    for (const tradeData of trades) {
      try {
        const trade = await base44.entities.Trade.create(tradeData);
        created.push(trade);
      } catch (error) {
        errors.push({ trade: tradeData.symbol, error: error.message });
      }
    }

    // Trigger daily stats recomputation for affected dates
    if (created.length > 0) {
      const dates = [...new Set(created.map(t => new Date(t.entry_time).toISOString().split('T')[0]))];
      const minDate = dates.sort()[0];
      const maxDate = dates.sort().reverse()[0];
      
      await base44.functions.invoke('computeDailyStats', {
        user_id: user.id,
        date_from: minDate,
        date_to: maxDate
      });
    }

    return Response.json({
      success: true,
      imported: created.length,
      errors: errors.length,
      error_details: errors
    });

  } catch (error) {
    console.error('Error importing trades:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});