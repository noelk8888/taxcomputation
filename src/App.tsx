import React, { useState } from 'react';
import { Building2, MapPin, PhilippinePeso } from 'lucide-react';
import './index.css';

function App() {
  const [listingAddress, setListingAddress] = useState('');
  const [totalContractPrice, setTotalContractPrice] = useState('');
  const [priceType, setPriceType] = useState('GROSS'); // GROSS or NET
  const [isGenerating, setIsGenerating] = useState(false);
  const [vatStatus, setVatStatus] = useState('VAT'); // VAT or NON VAT
  const gsheetLink = 'https://docs.google.com/spreadsheets/d/1O_MVdOKrHZLTwuu5vfwa0IygNyeNQ_wt3w35RzFmvsc/edit?gid=1456171567#gid=1456171567';
  
  const [lotArea, setLotArea] = useState('');
  const [zonalValue, setZonalValue] = useState('');
  const [improvementValue, setImprovementValue] = useState('');
  const [doasAmount, setDoasAmount] = useState('');

  // Part 2 States
  const [taxType, setTaxType] = useState('CGT'); // EWT or CGT
  const [hasBusinessTax, setHasBusinessTax] = useState(false);
  const [brokersFeePercent, setBrokersFeePercent] = useState('3');

  // Part 3 States
  const [notaryFeeAmount, setNotaryFeeAmount] = useState('8,000');
  const [itFeeAmount, setItFeeAmount] = useState('5,000');
  const [showNotaryEstimate, setShowNotaryEstimate] = useState(true);
  const [showItFeeEstimate, setShowItFeeEstimate] = useState(true);

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    // Allow numbers and a single decimal point
    const numericString = value.replace(/[^0-9.]/g, '');
    const parts = numericString.split('.');
    if (parts.length > 2) parts.length = 2;
    
    // Add commas to the integer part
    if (parts[0]) {
      parts[0] = parseInt(parts[0], 10).toLocaleString('en-US');
    }
    
    setter(parts.join('.'));
  };

  const handleNumberBlur = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    if (!value) return;
    const num = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(num)) {
      setter(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  // Automatically compute DOAS net of VAT
  const doasNetOfVat = React.useMemo(() => {
    const doas = parseFloat(doasAmount.replace(/,/g, ''));
    if (isNaN(doas)) return 0;
    return doas / 1.12;
  }, [doasAmount]);

  // Compute Total Zonal Value
  const totalZonalValueAmount = React.useMemo(() => {
    const la = parseFloat(lotArea.replace(/,/g, '')) || 0;
    const zv = parseFloat(zonalValue.replace(/,/g, '')) || 0;
    const iv = parseFloat(improvementValue.replace(/,/g, '')) || 0;
    
    if (la === 0 && zv === 0 && iv === 0) return 0;
    return (la * zv) + iv;
  }, [lotArea, zonalValue, improvementValue]);

  // Part 2 Computations
  const sellerTaxAmount = doasNetOfVat * 0.06;
  const vatAmount = vatStatus === 'VAT' ? doasNetOfVat * 0.12 : 0;
  const businessTaxAmount = hasBusinessTax ? doasNetOfVat * 0.02 : 0;
  
  const brokersFeeAmount = React.useMemo(() => {
    const tcp = parseFloat(totalContractPrice.replace(/,/g, ''));
    const percent = parseFloat(brokersFeePercent);
    if (isNaN(tcp) || isNaN(percent)) return 0;
    return tcp * (percent / 100);
  }, [totalContractPrice, brokersFeePercent]);

  const totalSellersExpense = sellerTaxAmount + vatAmount + businessTaxAmount + brokersFeeAmount;
  const netTotalContractPrice = parseFloat(totalContractPrice.replace(/,/g, '')) || 0;
  const totalGrossPrice = priceType === 'NET' ? (netTotalContractPrice + totalSellersExpense) : totalSellersExpense;

  // Part 3 Computations
  const dstAmount = doasNetOfVat * 0.015;
  const transferTaxAmount = doasNetOfVat * 0.0075;
  const registrationFeeAmount = doasNetOfVat > 0 ? ((((doasNetOfVat - 1700000) / 20000) * 90) + 8796) : 0;

  const totalBuyersExpense = React.useMemo(() => {
    const nf = parseFloat(notaryFeeAmount.replace(/,/g, '')) || 0;
    const itf = parseFloat(itFeeAmount.replace(/,/g, '')) || 0;
    return dstAmount + transferTaxAmount + registrationFeeAmount + nf + itf;
  }, [dstAmount, transferTaxAmount, registrationFeeAmount, notaryFeeAmount, itFeeAmount]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        listingAddress: listingAddress || "New Listing",
        totalContractPrice: parseFloat(totalContractPrice.replace(/,/g, '')) || 0,
        priceType: priceType,
        lotArea: parseFloat(lotArea.replace(/,/g, '')) || 0,
        zonalValue: parseFloat(zonalValue.replace(/,/g, '')) || 0,
        improvementValue: parseFloat(improvementValue.replace(/,/g, '')) || 0,
        doasAmount: parseFloat(doasAmount.replace(/,/g, '')) || 0,
        hasVat: vatStatus === 'VAT',
        taxType: taxType,
        hasBusinessTax: hasBusinessTax,
        brokersFeePercent: parseFloat(brokersFeePercent) || 0,
        notaryFeeAmount: parseFloat(notaryFeeAmount.replace(/,/g, '')) || 0,
        itFeeAmount: parseFloat(itFeeAmount.replace(/,/g, '')) || 0
      };

      const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbybwtYAuokdD5d4XjG8DvYlS-_h-qvwrdmXQ8hZ1jfVACT9Da488Yg8llHUNJk_yu1nBw/exec";

      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });
      
      alert("Successfully triggered! Please check your Google Sheet.");
    } catch (error) {
      alert("Failed to generate. Check console for details.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="card">
      <form onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Part 1. Listing Details</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="radio-group" style={{ marginTop: 0, gap: '0.75rem' }}>
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="priceType" 
                  value="GROSS" 
                  checked={priceType === 'GROSS'} 
                  onChange={(e) => setPriceType(e.target.value)} 
                />
                <span>Gross</span>
              </label>
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="priceType" 
                  value="NET" 
                  checked={priceType === 'NET'} 
                  onChange={(e) => setPriceType(e.target.value)} 
                />
                <span>Net</span>
              </label>
            </div>
          </div>
        </div>
        <div className="form-group">
          <div className="input-wrapper">
            <MapPin className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="e.g. 123 Luxury Ave, Makati City" 
              style={{ paddingLeft: '2.5rem' }}
              value={listingAddress}
              onChange={(e) => setListingAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="horizontal-group" style={{ margin: '0.5rem 0' }}>
          <label className="tcp-label">{priceType === 'NET' ? 'Net Price' : 'Total Contract Price'}</label>
          <div className="input-wrapper tcp-input-wrapper">
            <PhilippinePeso className="input-icon" size={24} style={{ left: '1rem' }} />
            <input 
              type="text" 
              inputMode="decimal"
              className="tcp-input"
              placeholder="0.00" 
              value={totalContractPrice}
              onChange={(e) => handleNumberChange(setTotalContractPrice, e.target.value)}
              onBlur={(e) => handleNumberBlur(setTotalContractPrice, e.target.value)}
            />
          </div>
        </div>



        <div className="horizontal-group">
          <label>Lot Area (in sqm)</label>
          <div className="input-wrapper">
            <Building2 className="input-icon" size={18} />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={lotArea}
              onChange={(e) => handleNumberChange(setLotArea, e.target.value)}
              onBlur={(e) => handleNumberBlur(setLotArea, e.target.value)}
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label>Zonal Value</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={zonalValue}
              onChange={(e) => handleNumberChange(setZonalValue, e.target.value)}
              onBlur={(e) => handleNumberBlur(setZonalValue, e.target.value)}
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label>Improvement Value</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={improvementValue}
              onChange={(e) => handleNumberChange(setImprovementValue, e.target.value)}
              onBlur={(e) => handleNumberBlur(setImprovementValue, e.target.value)}
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label>TOTAL ZONAL VALUE</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(totalZonalValueAmount)}
              readOnly
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }}
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label>DOAS Amount</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={20} style={{ color: '#2563eb' }} />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={doasAmount}
              onChange={(e) => handleNumberChange(setDoasAmount, e.target.value)}
              onBlur={(e) => handleNumberBlur(setDoasAmount, e.target.value)}
              style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1.1rem' }}
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label>DOAS Net of VAT</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(doasNetOfVat)}
              readOnly
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }}
            />
          </div>
        </div>

        <div className="divider" style={{ margin: '0.5rem 0', backgroundColor: '#ef4444' }}></div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{priceType === 'NET' ? 'Part 2: Gross Price Computation' : "Part 2: Seller's Expense"}</h2>

        <div className="horizontal-group">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div className="radio-group" style={{ marginTop: 0, alignItems: 'center', gap: '0.75rem' }}>
              <label className="radio-option" style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="taxType" 
                  value="CGT" 
                  checked={taxType === 'CGT'} 
                  onChange={(e) => setTaxType(e.target.value)} 
                />
                <span style={{ whiteSpace: 'nowrap' }}>CGT</span>
              </label>
              <label className="radio-option" style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="taxType" 
                  value="EWT" 
                  checked={taxType === 'EWT'} 
                  onChange={(e) => setTaxType(e.target.value)} 
                />
                <span style={{ whiteSpace: 'nowrap' }}>EWT</span>
              </label>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>(6% DOAS net)</span>
            </div>
          </div>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(sellerTaxAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div className="radio-group" style={{ marginTop: 0, alignItems: 'center', gap: '0.75rem' }}>
              <label className="radio-option" style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="vatStatus" 
                  value="VAT" 
                  checked={vatStatus === 'VAT'} 
                  onChange={(e) => setVatStatus(e.target.value)} 
                />
                <span style={{ whiteSpace: 'nowrap' }}>VAT 12% DOAS net</span>
              </label>
              <label className="radio-option" style={{ whiteSpace: 'nowrap' }}>
                <input 
                  type="radio" 
                  name="vatStatus" 
                  value="NON VAT" 
                  checked={vatStatus === 'NON VAT'} 
                  onChange={(e) => setVatStatus(e.target.value)} 
                />
                <span style={{ whiteSpace: 'nowrap' }}>Non-VAT</span>
              </label>
            </div>
          </div>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(vatAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group">
          <div style={{ flex: 1 }}>
            <label className="radio-option" style={{ display: 'inline-flex' }}>
              <input 
                type="checkbox" 
                checked={hasBusinessTax}
                onChange={(e) => setHasBusinessTax(e.target.checked)}
                style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Business Tax (2%)</span>
            </label>
          </div>
          <div className="input-wrapper" style={{ visibility: hasBusinessTax ? 'visible' : 'hidden' }}>
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(businessTaxAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ marginBottom: 0 }}>Broker's Fee</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '5rem' }}>
              <input 
                type="number" 
                step="any"
                placeholder="3" 
                value={brokersFeePercent}
                onChange={(e) => setBrokersFeePercent(e.target.value)}
                style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', width: '100%', textAlign: 'right' }}
              />
              <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', pointerEvents: 'none' }}>%</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>of TCP</span>
          </div>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(brokersFeeAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group" style={{ margin: '1rem 0 0.5rem 0' }}>
          <label className="tcp-label" style={{ whiteSpace: 'nowrap', marginRight: '0.5rem' }}>{priceType === 'NET' ? 'Total Gross Price' : "Total Seller's Expense"}</label>
          <div className="input-wrapper tcp-input-wrapper">
            <PhilippinePeso className="input-icon" size={24} style={{ left: '1rem' }} />
            <input 
              type="text" 
              className="tcp-input"
              value={priceType === 'NET' ? formatCurrency(totalGrossPrice) : formatCurrency(totalSellersExpense)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }} 
            />
          </div>
        </div>

        <div className="divider" style={{ margin: '0.5rem 0', backgroundColor: '#3b82f6' }}></div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Part 3. Buyer's Expenses</h2>

        <div className="horizontal-group">
          <label style={{ flex: 1 }}>DST (1.5% of DOAS Net)</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(dstAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label style={{ flex: 1 }}>Transfer Tax (0.75% of DOAS Net)</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(transferTaxAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group">
          <label style={{ flex: 1 }}>Registration Fee</label>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              value={formatCurrency(registrationFeeAmount)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontWeight: 600 }} 
            />
          </div>
        </div>

        <div className="horizontal-group">
          <div style={{ flex: 1 }}>
            <label style={{ marginBottom: 0 }}>
              Notary Fee 
              <span 
                onClick={() => setShowNotaryEstimate(!showNotaryEstimate)}
                style={{ color: 'var(--accent-color)', cursor: 'pointer', userSelect: 'none', marginLeft: '0.25rem' }}
              >
                {showNotaryEstimate ? '(estimate)' : ':'}
              </span>
            </label>
          </div>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={notaryFeeAmount}
              onChange={(e) => handleNumberChange(setNotaryFeeAmount, e.target.value)}
              onBlur={(e) => handleNumberBlur(setNotaryFeeAmount, e.target.value)}
            />
          </div>
        </div>

        <div className="horizontal-group">
          <div style={{ flex: 1 }}>
            <label style={{ marginBottom: 0 }}>
              IT Fee 
              <span 
                onClick={() => setShowItFeeEstimate(!showItFeeEstimate)}
                style={{ color: 'var(--accent-color)', cursor: 'pointer', userSelect: 'none', marginLeft: '0.25rem' }}
              >
                {showItFeeEstimate ? '(estimate)' : ':'}
              </span>
            </label>
          </div>
          <div className="input-wrapper">
            <PhilippinePeso className="input-icon" size={18} />
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={itFeeAmount}
              onChange={(e) => handleNumberChange(setItFeeAmount, e.target.value)}
              onBlur={(e) => handleNumberBlur(setItFeeAmount, e.target.value)}
            />
          </div>
        </div>

        <div className="horizontal-group" style={{ margin: '1rem 0 0.5rem 0' }}>
          <label className="tcp-label" style={{ whiteSpace: 'nowrap', marginRight: '0.5rem' }}>Total Buyer's Expense</label>
          <div className="input-wrapper tcp-input-wrapper">
            <PhilippinePeso className="input-icon" size={24} style={{ left: '1rem' }} />
            <input 
              type="text" 
              className="tcp-input"
              value={formatCurrency(totalBuyersExpense)} 
              readOnly 
              style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)' }}>
          <button 
            type="button" 
            className="generate-btn" 
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{ 
              opacity: isGenerating ? 0.7 : 1, 
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              padding: '0.75rem 2rem',
              fontSize: '1rem'
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          <button 
            type="button" 
            className="generate-btn" 
            onClick={() => window.open(gsheetLink, '_blank')}
            style={{ 
              backgroundColor: '#10b981',
              padding: '0.75rem 2rem',
              fontSize: '1rem'
            }}
          >
            GSHEET
          </button>

        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingBottom: '0.25rem' }}>
          Kiu Realty Ph 2026 @ Luxe Realty and Development Corporation
        </p>
      </form>
    </div>
  );
}

export default App;
