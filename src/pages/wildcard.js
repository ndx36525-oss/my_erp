const handleSubmit = async (e) => {
  e.preventDefault();
  if (lines.length === 0) return alert("Add at least one item to the table first");
  if (!selectedSupplier) return alert("Please select a vendor");

  setLoading(true);
  const supplierName = suppliers.find(s => s.id === selectedSupplier)?.name;
  const grandTotal = lines.reduce((sum, line) => sum + line.amount, 0);

  try {
    // 1. Create Journal Entry Header
    const { data: header, error: hErr } = await supabase
      .from('journal_entries')
      .insert([{ description: `Purchase: ${supplierName}` }])
      .select()
      .single();
    if (hErr) throw hErr;

    // 2. CONSOLIDATE QUANTITIES 
    // This creates an object like: { "item_id_1": totalQty, "item_id_2": totalQty }
    const consolidatedItems = lines.reduce((acc, line) => {
      acc[line.item_id] = (acc[line.item_id] || 0) + line.quantity;
      return acc;
    }, {});

    // 3. UPDATE ITEMS TABLE (One update per unique item)
    for (const [itemId, totalQtyToAdd] of Object.entries(consolidatedItems)) {
      // Fetch the latest stock level directly from DB right before updating
      // to avoid race conditions or stale state data
      const { data: currentItem, error: fetchErr } = await supabase
        .from('items')
        .select('quantity')
        .eq('id', itemId)
        .single();
      
      if (fetchErr) throw fetchErr;

      const newQty = (currentItem.quantity || 0) + totalQtyToAdd;
      
      const { error: updateErr } = await supabase
        .from('items')
        .update({ quantity: newQty })
        .eq('id', itemId);

      if (updateErr) throw updateErr;
    }

    // 4. INSERT TRANSACTIONS (Keep individual lines for audit/history)
    const transactionRecords = lines.map(line => ({
      item_id: line.item_id,
      type: 'purchase',
      quantity: line.quantity,
      entity_name: supplierName
    }));

    const { error: transErr } = await supabase
      .from('transactions')
      .insert(transactionRecords);
    
    if (transErr) throw transErr;

    // 5. FINANCIAL ENTRIES (Inventory vs Cash/AP)
    const CASH_ACC = 'ccc129ab-c1f4-457b-ad67-9a3df3556b85'; 
    const AP_ACC = '987f41e7-f2b9-44ee-855e-07ad08522197'; 
    const INV_ACC = 'c57bebc2-0135-4442-81f9-34c034ada268';
    const creditAccount = paymentMethod === 'cash' ? CASH_ACC : AP_ACC;

    const { error: journalErr } = await supabase.from('journal_lines').insert([
      { entry_id: header.id, account_id: INV_ACC, debit: grandTotal, credit: 0 },
      { entry_id: header.id, account_id: creditAccount, debit: 0, credit: grandTotal }
    ]);

    if (journalErr) throw journalErr;

    alert("Inventory Received and Consolidated Successfully!");
    setLines([]);
    setSelectedSupplier('');
    fetchData(); // Refresh the items list to show new quantities
  } catch (err) { 
    alert("Error: " + err.message); 
  } finally { 
    setLoading(false); 
  }
};