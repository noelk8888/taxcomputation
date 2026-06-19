function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById('1O_MVdOKrHZLTwuu5vfwa0IygNyeNQ_wt3w35RzFmvsc');
    
    // Support both uppercase/lowercase variations of NET/GROSS
    const isNetPrice = (data.priceType && data.priceType.toUpperCase() === 'NET');
    let templateSheetName = isNetPrice ? 'SAMPLE NET' : 'SAMPLE';
    const templateSheet = ss.getSheetByName(templateSheetName) || ss.getSheets()[0];
    
    const newSheet = templateSheet.copyTo(ss);
    
    const maxCols = newSheet.getMaxColumns();
    if (maxCols > 3) {
      newSheet.deleteColumns(4, maxCols - 3);
    }
    const maxRows = newSheet.getMaxRows();
    if (maxRows > 29) {
      newSheet.deleteRows(30, maxRows - 29);
    }
    
    let baseName = data.listingAddress || "New Listing";
    let newName = baseName;
    let counter = 1;
    while (ss.getSheetByName(newName)) {
      newName = baseName + " (" + counter + ")";
      counter++;
    }
    newSheet.setName(newName);
    
    // Put Listing Address in A1
    newSheet.getRange('A1').setValue(data.listingAddress);
    // Erase old template leftover mistakes
    newSheet.getRange('B1').clearContent();
    newSheet.getRange('B21').clearContent();
    
    // Clear all template notes/comments from A1:C29
    newSheet.getRange('A1:C29').clearNote();
    
    // Determine tax type and base cells
    const isEWT = (data.taxType === 'EWT');
    const isZonalHigher = (data.totalZonalValueAmount > data.doasAmount);
    
    // B11 is EWT's base, which is MAX(B10, B8)/1.12 (DOAS is B10, Total Zonal Value is B8)
    const baseCell = isEWT ? 'B11' : 'MAX(B10, B8)';
    
    // 1. Basic properties formulas
    newSheet.getRange('B6').setFormula('=B4*B5');
    newSheet.getRange('B8').setFormula('=B6+B7');
    
    // Handle row 11 (NET OF VAT / DOAS NET OF VAT / ZONAL NET OF VAT)
    if (isEWT) {
      const vatBaseLabel = isZonalHigher ? 'ZONAL NET OF VAT' : 'DOAS NET OF VAT';
      newSheet.getRange('A11').setValue(vatBaseLabel);
      newSheet.getRange('B11').setFormula('=MAX(B10, B8)/1.12');
    } else {
      // If it is CGT, erase Row 11 entirely!
      newSheet.getRange('A11:C11').clearContent();
    }
    
    // 2. Seller's expenses labels and formulas
    if (isEWT) {
      const ewtLabel = isZonalHigher ? 'EWT (6% of ZONAL Net)' : 'EWT (6% of DOAS Net)';
      newSheet.getRange('A15').setValue(ewtLabel);
      newSheet.getRange('B15').setFormula('=' + baseCell + '*0.06');
    } else {
      const cgtLabel = isZonalHigher ? 'CGT (6% of ZONAL)' : 'CGT (6% of DOAS)';
      newSheet.getRange('A15').setValue(cgtLabel);
      newSheet.getRange('B15').setFormula('=' + baseCell + '*0.06');
    }
    
    // VAT A16 Label and B16 Formula
    const vatLabel = isZonalHigher
      ? (isEWT ? 'VAT (12% of ZONAL Net)' : 'VAT (12% of ZONAL)')
      : (isEWT ? 'VAT (12% of DOAS Net)' : 'VAT (12% of DOAS)');
    newSheet.getRange('A16').setValue(vatLabel);
    
    if (data.hasVat) {
      newSheet.getRange('B16').setFormula('=' + baseCell + '*0.12');
    } else {
      newSheet.getRange('B16').setFormula('=0');
    }
    
    // Business Tax A17 Label and B17 Formula
    const busLabel = isZonalHigher
      ? (isEWT ? 'BUSINESS TAX (2% of ZONAL Net)' : 'BUSINESS TAX (2% of ZONAL)')
      : (isEWT ? 'BUSINESS TAX (2% of DOAS Net)' : 'BUSINESS TAX (2% of DOAS)');
    newSheet.getRange('A17').setValue(busLabel);
    
    if (data.hasBusinessTax) {
      newSheet.getRange('B17').setFormula('=' + baseCell + '*0.02');
    } else {
      newSheet.getRange('B17').setFormula('=0');
    }
    
    // Broker fee percentage
    const feePct = data.brokersFeePercent || 0;
    newSheet.getRange('A19').setValue("BROKER'S FEE (" + feePct + "% of TCP)");
    newSheet.getRange('B19').setFormula('=B2*' + (feePct / 100));
    
    // B20 (Total Seller's Expense or Total Gross Price)
    if (isNetPrice) {
      newSheet.getRange('B20').setFormula('=B2+SUM(B15:B19)');
    } else {
      newSheet.getRange('B20').setFormula('=SUM(B15:B19)');
    }
    
    // 3. Buyer's expenses labels and formulas
    const dstLabel = isZonalHigher
      ? (isEWT ? 'DST (1.5% of ZONAL Net)' : 'DST (1.5% of ZONAL)')
      : (isEWT ? 'DST (1.5% of DOAS Net)' : 'DST (1.5% of DOAS)');
      
    const transferLabel = isZonalHigher
      ? (isEWT ? 'Transfer Tax (0.75% of ZONAL Net)' : 'Transfer Tax (0.75% of ZONAL)')
      : (isEWT ? 'Transfer Tax (0.75% of DOAS Net)' : 'Transfer Tax (0.75% of DOAS)');
      
    newSheet.getRange('A24').setValue(dstLabel);
    newSheet.getRange('A25').setValue(transferLabel);
    
    newSheet.getRange('B24').setFormula('=' + baseCell + '*0.015');
    newSheet.getRange('B25').setFormula('=' + baseCell + '*0.0075');
    
    // Registration Fee formula
    newSheet.getRange('B26').setFormula('=IF(' + baseCell + '>0, (((' + baseCell + '-1700000)/20000)*90)+8796, 0)');
    
    // B29 (Total Buyer's Expense)
    newSheet.getRange('B29').setFormula('=SUM(B24:B28)');
    
    // 4. Static cell mappings (Only write user input values)
    const CELL_MAPPING = {
      totalContractPrice: 'B2',     
      lotArea: 'B4',                
      zonalValue: 'B5',             
      improvementValue: 'B7',       
      doasAmount: 'B10',            
      notaryFeeAmount: 'B27',       
      itFeeAmount: 'B28'
    };

    for (const [dataKey, cellAddress] of Object.entries(CELL_MAPPING)) {
      if (data[dataKey] !== undefined && cellAddress !== '') {
        newSheet.getRange(cellAddress).setValue(data[dataKey]);
      }
    }
    
    SpreadsheetApp.flush();

    const finalUrl = ss.getUrl() + '#gid=' + newSheet.getSheetId();

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      url: finalUrl 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
