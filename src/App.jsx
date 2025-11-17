// src/App.jsx
import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList,
} from 'recharts';

// Compact range slider
const RangeSlider = ({ label, value, min, max, step, onChange, formatValue }) => (
  <div className="slider-block">
    <label className="slider-label">
      {label}: {formatValue ? formatValue(value) : value}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="slider-input"
    />
  </div>
);

const App = () => {
  // Core adjustable parameters
  const [mortgageRate, setMortgageRate] = useState(6);
  const [salaryMortgageEarly, setSalaryMortgageEarly] = useState(18);
  const [salaryMortgageLater, setSalaryMortgageLater] = useState(10);

  const [realGrowthCosts, setRealGrowthCosts] = useState(2);
  const [realGrowthProperty, setRealGrowthProperty] = useState(2);
  const [isaGrowth, setIsaGrowth] = useState(3);

  const [initialMortgage, setInitialMortgage] = useState(300000);
  const [initialDeposit, setInitialDeposit] = useState(300000);
  const [secondMortgage, setSecondMortgage] = useState(100000);
  const [isaSeed, setIsaSeed] = useState(0);

  const [income1Start, setIncome1Start] = useState(90000);
  const [income2Start, setIncome2Start] = useState(90000);
  const [incomeGrowth, setIncomeGrowth] = useState(0);

  // Second house - timing and deposit (from ISA)
  const [secondHouseYear, setSecondHouseYear] = useState(2037);
  const [secondHouseDeposit, setSecondHouseDeposit] = useState(200000);

  // Child birth years
  const [child1BirthYear, setChild1BirthYear] = useState(2032);
  const [child2BirthYear, setChild2BirthYear] = useState(2034);

  // Recession years
  const [recessionYear, setRecessionYear] = useState(2035);
  const [secondRecessionYear, setSecondRecessionYear] = useState(2042);

  // Advanced / hidden parameters
  const [pensionRate, setPensionRate] = useState(5); // % of gross
  const [baseLivingCost, setBaseLivingCost] = useState(40000);
  const [child1AnnualCost, setChild1AnnualCost] = useState(30000);
  const [child2AnnualCost, setChild2AnnualCost] = useState(20000);
  const [emergencyFundAnnual, setEmergencyFundAnnual] = useState(5000);

  const [visaCostPreSecondHouse, setVisaCostPreSecondHouse] = useState(2200);
  const [visaCostAtSecondHouse, setVisaCostAtSecondHouse] = useState(2500);

  const [carCost, setCarCost] = useState(20000);
  const [kid1GiftAmount, setKid1GiftAmount] = useState(100000);
  const [kid2GiftAmount, setKid2GiftAmount] = useState(100000);
  const [combinedGiftAmount, setCombinedGiftAmount] = useState(200000);

  const [isaContributionCap, setIsaContributionCap] = useState(40000);
  const [recessionHitPct, setRecessionHitPct] = useState(20);
  const [cgtRatePct, setCgtRatePct] = useState(20);

  // Initial cash pool: must equal initialDeposit + isaSeed
  const [initialCash, setInitialCash] = useState(300000);

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Lock between initial and second house (keep sums constant)
  const [lockHouseLink, setLockHouseLink] = useState(false);
  const [depositPool, setDepositPool] = useState(300000 + 200000);
  const [mortgagePool, setMortgagePool] = useState(300000 + 100000);

  // Private school toggle
  const [usePrivateSchool, setUsePrivateSchool] = useState(false);

  // Chart line visibility toggles
  const [showIncomeLine, setShowIncomeLine] = useState(true);
  const [showSurplusLine, setShowSurplusLine] = useState(true);
  const [showIsaLine, setShowIsaLine] = useState(true);
  const [showMortgagePaidLine, setShowMortgagePaidLine] = useState(true);
  const [showInterestLine, setShowInterestLine] = useState(true);

  // Presets
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');

  // Added zoom out toggle to allow uncapped chart view
  const [zoomOut, setZoomOut] = useState(false);

  // Derived values
  const initialPropertyValue = useMemo(
    () => initialMortgage + initialDeposit,
    [initialMortgage, initialDeposit],
  );

  // Incremental move value (added to grown property at move year)
  const moveIncrementValue = useMemo(
    () => secondMortgage + secondHouseDeposit,
    [secondMortgage, secondHouseDeposit],
  );

  const kid1GiftYear = child1BirthYear + 27;
  const kid2GiftYear = child2BirthYear + 27;

  // Keep initialCash = initialDeposit + isaSeed

  const handleInitialCashChange = (value) => {
    const newCash = Math.max(0, value);
    let newDeposit = initialDeposit;
    if (newDeposit > newCash) {
      newDeposit = newCash;
    }
    const newIsa = Math.max(0, newCash - newDeposit);
    setInitialCash(newCash);
    setInitialDeposit(newDeposit);
    setIsaSeed(newIsa);
  };

  const handleInitialDepositChange = (value) => {
    const raw = Math.max(0, value);
    const maxFromCash = initialCash;
    const maxFromPool = lockHouseLink ? depositPool : Infinity;
    const maxAllowed = Math.min(maxFromCash, maxFromPool);
    const newDeposit = Math.min(raw, maxAllowed);

    const newIsa = Math.max(0, initialCash - newDeposit);
    setInitialDeposit(newDeposit);
    setIsaSeed(newIsa);

    if (lockHouseLink) {
      const newSecondDeposit = Math.max(0, depositPool - newDeposit);
      setSecondHouseDeposit(newSecondDeposit);
    }
  };

  const handleIsaSeedChange = (value) => {
    const raw = Math.max(0, value);
    const newIsa = Math.min(raw, initialCash);
    const newDeposit = Math.max(0, initialCash - newIsa);
    setIsaSeed(newIsa);
    setInitialDeposit(newDeposit);

    if (lockHouseLink) {
      const newSecondDeposit = Math.max(0, depositPool - newDeposit);
      setSecondHouseDeposit(newSecondDeposit);
    }
  };

  const handleInitialMortgageChange = (value) => {
    const raw = Math.max(0, value);
    if (!lockHouseLink) {
      setInitialMortgage(raw);
      return;
    }
    const maxAllowed = mortgagePool;
    const newInitialMortgage = Math.min(raw, maxAllowed);
    const newSecondMortgage = Math.max(0, mortgagePool - newInitialMortgage);
    setInitialMortgage(newInitialMortgage);
    setSecondMortgage(newSecondMortgage);
  };

  const handleSecondMortgageChange = (value) => {
    const raw = Math.max(0, value);
    if (!lockHouseLink) {
      setSecondMortgage(raw);
      return;
    }
    const maxAllowed = mortgagePool;
    const newSecondMortgage = Math.min(raw, maxAllowed);
    const newInitialMortgage = Math.max(0, mortgagePool - newSecondMortgage);
    setSecondMortgage(newSecondMortgage);
    setInitialMortgage(newInitialMortgage);
  };

  const handleSecondHouseDepositChange = (value) => {
    const raw = Math.max(0, value);
    if (!lockHouseLink) {
      setSecondHouseDeposit(raw);
      return;
    }
    const maxSecondFromPool = depositPool;
    let newSecondDeposit = Math.min(raw, maxSecondFromPool);
    let newInitialDeposit = depositPool - newSecondDeposit;

    if (newInitialDeposit > initialCash) {
      newInitialDeposit = initialCash;
      newSecondDeposit = Math.max(0, depositPool - newInitialDeposit);
    }

    const newIsa = Math.max(0, initialCash - newInitialDeposit);

    setSecondHouseDeposit(newSecondDeposit);
    setInitialDeposit(newInitialDeposit);
    setIsaSeed(newIsa);
  };

  const toggleHouseLock = () => {
    setLockHouseLink(prev => {
      const next = !prev;
      if (next) {
        setDepositPool(initialDeposit + secondHouseDeposit);
        setMortgagePool(initialMortgage + secondMortgage);
      }
      return next;
    });
  };

  // Preset save/load

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;

    const preset = {
      name,
      mortgageRate,
      salaryMortgageEarly,
      salaryMortgageLater,
      realGrowthCosts,
      realGrowthProperty,
      isaGrowth,
      initialMortgage,
      initialDeposit,
      secondMortgage,
      isaSeed,
      income1Start,
      income2Start,
      incomeGrowth,
      secondHouseYear,
      secondHouseDeposit,
      child1BirthYear,
      child2BirthYear,
      recessionYear,
      secondRecessionYear,
      pensionRate,
      baseLivingCost,
      child1AnnualCost,
      child2AnnualCost,
      emergencyFundAnnual,
      visaCostPreSecondHouse,
      visaCostAtSecondHouse,
      carCost,
      kid1GiftAmount,
      kid2GiftAmount,
      isaContributionCap,
      recessionHitPct,
      cgtRatePct,
      initialCash,
      usePrivateSchool,
      lockHouseLink,
      showIncomeLine,
      showSurplusLine,
      showIsaLine,
      showMortgagePaidLine,
      showInterestLine,
    };

    setSavedPresets(prev => {
      const others = prev.filter(p => p.name !== name);
      return [...others, preset];
    });
    setSelectedPreset(name);
  };

  const applyPreset = (p) => {
    setMortgageRate(p.mortgageRate);
    setSalaryMortgageEarly(p.salaryMortgageEarly);
    setSalaryMortgageLater(p.salaryMortgageLater);
    setRealGrowthCosts(p.realGrowthCosts);
    setRealGrowthProperty(p.realGrowthProperty);
    setIsaGrowth(p.isaGrowth);

    setInitialMortgage(p.initialMortgage);
    setSecondMortgage(p.secondMortgage);
    setInitialDeposit(p.initialDeposit);
    setIsaSeed(p.isaSeed);
    const initialCashVal =
      p.initialCash != null ? p.initialCash : (p.initialDeposit + p.isaSeed);
    setInitialCash(initialCashVal);

    setSecondHouseYear(p.secondHouseYear);
    setSecondHouseDeposit(p.secondHouseDeposit);

    setIncome1Start(p.income1Start);
    setIncome2Start(p.income2Start);
    setIncomeGrowth(p.incomeGrowth);

    setChild1BirthYear(p.child1BirthYear);
    setChild2BirthYear(p.child2BirthYear);

    setRecessionYear(p.recessionYear);
    setSecondRecessionYear(p.secondRecessionYear);

    setPensionRate(p.pensionRate);
    setBaseLivingCost(p.baseLivingCost);
    setChild1AnnualCost(p.child1AnnualCost);
    setChild2AnnualCost(p.child2AnnualCost);
    setEmergencyFundAnnual(p.emergencyFundAnnual);

    setVisaCostPreSecondHouse(p.visaCostPreSecondHouse);
    setVisaCostAtSecondHouse(p.visaCostAtSecondHouse);

    setCarCost(p.carCost);
    setKid1GiftAmount(p.kid1GiftAmount);
    setKid2GiftAmount(p.kid2GiftAmount);

    setIsaContributionCap(p.isaContributionCap);
    setRecessionHitPct(p.recessionHitPct);
    setCgtRatePct(p.cgtRatePct);

    setUsePrivateSchool(!!p.usePrivateSchool);

    const depositPoolVal = p.initialDeposit + p.secondHouseDeposit;
    const mortgagePoolVal = p.initialMortgage + p.secondMortgage;
    setDepositPool(depositPoolVal);
    setMortgagePool(mortgagePoolVal);
    setLockHouseLink(!!p.lockHouseLink);

    setShowIncomeLine(p.showIncomeLine ?? true);
    setShowSurplusLine(p.showSurplusLine ?? true);
    setShowIsaLine(p.showIsaLine ?? true);
    setShowMortgagePaidLine(p.showMortgagePaidLine ?? true);
    setShowInterestLine(p.showInterestLine ?? true);
  };

  const handleLoadPreset = () => {
    if (!selectedPreset) return;
    const preset = savedPresets.find(p => p.name === selectedPreset);
    if (!preset) return;
    applyPreset(preset);
  };

  // Added ability to edit and delete presets
  const handleEditPreset = (presetName) => {
    const preset = savedPresets.find(p => p.name === presetName);
    if (preset) {
      applyPreset(preset);
      setPresetName(preset.name);
    }
  };

  // Load presets from localStorage on app initialization
  useEffect(() => {
    const storedPresets = localStorage.getItem('savedPresets');
    if (storedPresets) {
      setSavedPresets(JSON.parse(storedPresets));
    } else {
      setSavedPresets([]); // Ensure dropdown renders even if no presets exist
    }
  }, []);

  // Save presets to localStorage whenever they are updated
  useEffect(() => {
    localStorage.setItem('savedPresets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  // Updated handleDeletePreset to remove from localStorage
  const handleDeletePreset = (presetName) => {
    setSavedPresets(prev => {
      const updatedPresets = prev.filter(p => p.name !== presetName);
      localStorage.setItem('savedPresets', JSON.stringify(updatedPresets));
      return updatedPresets;
    });
    if (selectedPreset === presetName) {
      setSelectedPreset('');
    }
  };

  // Simplified UK post-tax calculator
  const calculatePostTax = (income) => {
    if (income <= 12570) return income;
    if (income <= 50270) return 12570 + (income - 12570) * 0.8;
    if (income <= 125140) return 12570 + 37700 * 0.8 + (income - 50270) * 0.6;
    return 12570 + 37700 * 0.8 + 74870 * 0.6 + (income - 125140) * 0.55;
  };

  const formatCurrency = (value) => {
    const abs = Math.abs(value);
    if (abs >= 1000000) return `£${(value / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  // Main simulation
  const {
    financialData,
    mortgageRepayYear,
    secondHouseValueAtMove,
  } = useMemo(() => {
    const data = [];
    const startYear = 2027;
    const startAge = 29;
    const maxYear = 2069;

    let mortgageBalance = initialMortgage;
    let propertyValue = initialPropertyValue;
    let isaTotal = isaSeed;
    let cumulativeMortgageInterest = 0;
    let cumulativeMortgageRepayment = 0;
    let surplusPot = 0;
    let cumulativeShortfall = 0;
    const cgtRate = cgtRatePct / 100;
    const recessionFactor = 1 - recessionHitPct / 100;

    let mortgageRepayYearLocal = null;
    let secondHouseValueAtMoveLocal = null;

    for (let year = startYear; year <= maxYear; year++) {
      const yearsFromStart = year - startYear;
      const age = startAge + yearsFromStart;

      // Gross incomes with shared real growth
      let income1 = income1Start * Math.pow(1 + incomeGrowth / 100, yearsFromStart);
      let income2 = income2Start * Math.pow(1 + incomeGrowth / 100, yearsFromStart);

      // Mat leave on second income in birth years
      if (year === child1BirthYear || year === child2BirthYear) {
        income2 = income2 * 0.5;
      }

      const grossIncome = income1 + income2;

      // Post-tax combined income, then pension
      const postTax1 = calculatePostTax(income1);
      const postTax2 = calculatePostTax(income2);
      const netBeforePension = postTax1 + postTax2;
      const pension = grossIncome * (pensionRate / 100);
      const netIncome = netBeforePension - pension;

      const totalPostTax = netIncome;

      // Property real growth
      propertyValue *= 1 + realGrowthProperty / 100;

      // Recessions
      const isRecessionYearFlag =
        year === recessionYear || year === secondRecessionYear;
      if (isRecessionYearFlag) {
        propertyValue *= recessionFactor;
        isaTotal *= recessionFactor;
      }

      // Second house event
      if (year === secondHouseYear) {
        const withdrawn = Math.min(secondHouseDeposit, isaTotal);
        isaTotal -= withdrawn;
        mortgageBalance += secondMortgage;
        propertyValue = propertyValue + moveIncrementValue;
        secondHouseValueAtMoveLocal = propertyValue;
      }

      // Visa/travel costs
      let visaCost = 0;
      if (year <= 2036) {
        visaCost = visaCostPreSecondHouse;
      } else if (year === secondHouseYear) {
        visaCost = visaCostAtSecondHouse;
      }

      // Mortgage interest and repayments
      const yearlyRate = mortgageRate / 100;
      const mortgageInterest = mortgageBalance * yearlyRate;

      let mortgageRepayment = 0;
      if (mortgageBalance > 0) {
        const salaryPercent =
          year <= secondHouseYear ? salaryMortgageEarly / 100 : salaryMortgageLater / 100;

        // Repayment sized from gross income
        mortgageRepayment = grossIncome * salaryPercent;

        const maxPossible = mortgageBalance + mortgageInterest;
        if (mortgageRepayment > maxPossible) {
          mortgageRepayment = maxPossible;
        }

        const principalPayment = mortgageRepayment - mortgageInterest;
        mortgageBalance = Math.max(0, mortgageBalance - principalPayment);

        cumulativeMortgageInterest += mortgageInterest;
        cumulativeMortgageRepayment += mortgageRepayment;

        if (mortgageBalance <= 0.01 && mortgageRepayYearLocal === null) {
          mortgageRepayYearLocal = year;
        }
      }

      // Living costs
      const baseLivingCosts =
        baseLivingCost * Math.pow(1 + realGrowthCosts / 100, yearsFromStart);

      // Child costs
      let childCosts = 0;
      if (year >= child1BirthYear + 1 && year <= child1BirthYear + 21) {
        childCosts += child1AnnualCost;
      }
      if (year >= child2BirthYear + 1 && year <= child2BirthYear + 21) {
        childCosts += child2AnnualCost;
      }

      // Private school costs (age 11-18)
      let privateSchoolCost = 0;
      if (usePrivateSchool) {
        const kid1Age = year - child1BirthYear;
        const kid2Age = year - child2BirthYear;
        const feeBase = 30000;
        const feeFactor = Math.pow(1 + realGrowthCosts / 100, yearsFromStart);

        if (kid1Age >= 11 && kid1Age <= 18) {
          privateSchoolCost += feeBase * feeFactor;
        }
        if (kid2Age >= 11 && kid2Age <= 18) {
          privateSchoolCost += feeBase * feeFactor;
        }
      }

      const emergencyFund = emergencyFundAnnual;

      // Lump sums - car and gifts
      let lumpSum = 0;
      if (year === 2028) {
        lumpSum += carCost;
      }
      if (year === kid1GiftYear) {
        lumpSum += kid1GiftAmount;
      }
      if (year === kid2GiftYear) {
        lumpSum += kid2GiftAmount;
      }

      // Net cash left after all costs
      const totalLeft =
        totalPostTax -
        visaCost -
        mortgageRepayment -
        baseLivingCosts -
        childCosts -
        privateSchoolCost -
        emergencyFund -
        lumpSum;

      // Adjust totalLeft logic to deduct from surplus and ISA when negative
      if (totalLeft < 0) {
        const shortfall = -totalLeft;

        // Deduct from surplus pot first
        const surplusDeduction = Math.min(shortfall, surplusPot);
        surplusPot -= surplusDeduction;

        // Deduct remaining shortfall from ISA
        const remainingShortfall = shortfall - surplusDeduction;
        const isaDeduction = Math.min(remainingShortfall, isaTotal);
        isaTotal -= isaDeduction;

        // Track cumulative shortfall for any remaining amount
        cumulativeShortfall += remainingShortfall - isaDeduction;
      }

      // ISA contribution (capped)
      const isaContribution = Math.min(Math.max(0, totalLeft), isaContributionCap);
      isaTotal = isaTotal * (1 + isaGrowth / 100) + isaContribution;

      // Surplus pot (assumes same growth as ISA, with CGT)
      const surplusContribution = Math.max(0, totalLeft - isaContribution);
      const growthRate = isaGrowth / 100;
      const grossGrowth = surplusPot * growthRate;
      const afterTaxGrowth = grossGrowth * (1 - cgtRate);
      surplusPot = surplusPot + afterTaxGrowth + surplusContribution;

      const isaBelowThreshold = isaTotal < 60000;

      // Display values for mortgage lines (stop after payoff)
      let displayMortgagePayments = cumulativeMortgageRepayment;
      let displayInterestPaid = cumulativeMortgageInterest;
      if (mortgageRepayYearLocal && year > mortgageRepayYearLocal) {
        displayMortgagePayments = null;
        displayInterestPaid = null;
      }

      data.push({
        year,
        age,
        combinedIncomeGross: grossIncome,
        combinedIncomeNet: netIncome,
        propertyValue,
        isaTotal,
        isaBelowThreshold,
        mortgageBalance,
        totalMortgagePayments: cumulativeMortgageRepayment,
        totalInterestPaid: cumulativeMortgageInterest,
        totalMortgagePaymentsDisplay: displayMortgagePayments,
        totalInterestPaidDisplay: displayInterestPaid,
        surplusPot,
        cumulativeShortfall,
      });
    }

    return {
      financialData: data,
      mortgageRepayYear: mortgageRepayYearLocal,
      secondHouseValueAtMove: secondHouseValueAtMoveLocal,
    };
  }, [
    mortgageRate,
    salaryMortgageEarly,
    salaryMortgageLater,
    realGrowthCosts,
    realGrowthProperty,
    isaGrowth,
    initialMortgage,
    initialDeposit,
    secondMortgage,
    isaSeed,
    income1Start,
    income2Start,
    incomeGrowth,
    initialPropertyValue,
    secondHouseYear,
    secondHouseDeposit,
    moveIncrementValue,
    child1BirthYear,
    child2BirthYear,
    kid1GiftYear,
    kid2GiftYear,
    recessionYear,
    secondRecessionYear,
    pensionRate,
    baseLivingCost,
    child1AnnualCost,
    child2AnnualCost,
    emergencyFundAnnual,
    visaCostPreSecondHouse,
    visaCostAtSecondHouse,
    carCost,
    kid1GiftAmount,
    kid2GiftAmount,
    isaContributionCap,
    recessionHitPct,
    cgtRatePct,
    usePrivateSchool,
  ]);

  const finalYear = financialData[financialData.length - 1] || {};
  const totalMortgagePayments = finalYear.totalMortgagePayments || 0;
  const finalPropertyValue = finalYear.propertyValue || 0;
  const finalIsaTotal = finalYear.isaTotal || 0;
  const finalSurplusPot = finalYear.surplusPot || 0;
  const finalMortgageBalance = finalYear.mortgageBalance || 0;
  const finalShortfall = finalYear.cumulativeShortfall || 0;
  const finalLiquidNet = finalIsaTotal + finalSurplusPot - finalMortgageBalance - finalShortfall;

  const finalCombinedGross = finalYear.combinedIncomeGross || 0;
  const finalTotalInterestPaid = finalYear.totalInterestPaid || 0;

  // Second house value indicator
  const secondHouseValue =
    secondHouseValueAtMove != null
      ? secondHouseValueAtMove
      : initialPropertyValue + moveIncrementValue;

  // Label positions
  const labelIndex = financialData.length
    ? Math.floor(financialData.length * 0.6)
    : 0;

    const renderEndLabel = (color) => (props) => {
      const { x, y, index, value } = props;
      if (!financialData.length || index !== financialData.length - 1) return null;
      if (value == null || Number.isNaN(value)) return null;
    
      return (
        <text x={x + 4} y={y} fill={color} fontSize={10}>
          {formatCurrency(value)}
        </text>
      );
    };

  const renderInlineNameLabel = (text, color) => (props) => {
    const { x, y, index } = props;
    if (index !== labelIndex) return null;
    return (
      <text
        x={x + 4}
        y={y - 6}
        fill={color}
        fontSize={10}
        fontWeight={600}
      >
        {text}
      </text>
    );
  };

  return (
    <div className="app-root">
      <h1 className="app-title">Financial Life Planner</h1>
      <p className="app-subtitle">
        Combined pre-tax income line; all costs applied to post-tax income
      </p>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card summary-accent-cyan">
          <div className="summary-label">Final Total Cash</div>
          <div className="summary-value">
            {formatCurrency(finalLiquidNet)}
          </div>
          <div className="summary-sub">
            ISA + surplus pot − outstanding mortgage
          </div>
        </div>

        <div className="summary-card summary-accent-blue">
          <div className="summary-label">Total Mortgage Payments</div>
          <div className="summary-value">
            {formatCurrency(totalMortgagePayments)}
          </div>
          <div className="summary-sub">
            Principal + interest to 2069
          </div>
        </div>

        <div className="summary-card summary-accent-green">
          <div className="summary-label">Final Property Value</div>
          <div className="summary-value">
            {formatCurrency(finalPropertyValue)}
          </div>
          <div className="summary-sub">
            Real property growth {realGrowthProperty}%
          </div>
        </div>
      </div>

      {/* Chart + sliders */}
      <div className="chart-card">
        <h2 className="panel-title">Complete Financial Overview</h2>

        {/* Preset controls */}
        <div className="preset-row">
          <input
            className="preset-name-input"
            type="text"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder="Preset name"
          />
          <button
            type="button"
            className="preset-button"
            onClick={handleSavePreset}
          >
            Save preset
          </button>
          <select
            className="preset-select"
            value={selectedPreset}
            onChange={e => setSelectedPreset(e.target.value)}
          >
            <option value="">Load preset…</option>
            {savedPresets.map(p => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="preset-button"
            onClick={handleLoadPreset}
            disabled={!selectedPreset}
          >
            Load
          </button>
          <button
            type="button"
            className="preset-button"
            onClick={() => handleEditPreset(selectedPreset)}
            disabled={!selectedPreset}
          >
            Edit
          </button>
          <button
            type="button"
            className="preset-button"
            onClick={() => handleDeletePreset(selectedPreset)}
            disabled={!selectedPreset}
          >
            Delete
          </button>
        </div>

        {/* Advanced / hidden parameters */}
        <div className="advanced-box">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced(prev => !prev)}
          >
            {showAdvanced ? 'Hide advanced cost parameters' : 'Show advanced cost parameters'}
          </button>

          {showAdvanced && (
            <div className="advanced-grid">
              {/* Initial cash pool */}
              <RangeSlider
                label="Initial Cash Level (Deposit + ISA seed)"
                value={initialCash}
                min={0}
                max={1000000}
                step={10000}
                onChange={handleInitialCashChange}
                formatValue={formatCurrency}
              />

              {/* Income / pension */}
              <RangeSlider
                label="Pension Rate (% of gross)"
                value={pensionRate}
                min={0}
                max={15}
                step={0.5}
                onChange={setPensionRate}
                formatValue={v => `${v}%`}
              />

              {/* Base living & kids */}
              <RangeSlider
                label="Base Living Costs (start)"
                value={baseLivingCost}
                min={20000}
                max={80000}
                step={2000}
                onChange={setBaseLivingCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Child 1 Annual Cost"
                value={child1AnnualCost}
                min={5000}
                max={50000}
                step={5000}
                onChange={setChild1AnnualCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Child 2 Annual Cost"
                value={child2AnnualCost}
                min={5000}
                max={50000}
                step={5000}
                onChange={setChild2AnnualCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Emergency Fund per Year"
                value={emergencyFundAnnual}
                min={0}
                max={20000}
                step={1000}
                onChange={setEmergencyFundAnnual}
                formatValue={formatCurrency}
              />

              {/* Visa costs */}
              <RangeSlider
                label="Visa Cost (years ≤ 2036)"
                value={visaCostPreSecondHouse}
                min={0}
                max={5000}
                step={100}
                onChange={setVisaCostPreSecondHouse}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Visa Cost at Second House Year"
                value={visaCostAtSecondHouse}
                min={0}
                max={5000}
                step={100}
                onChange={setVisaCostAtSecondHouse}
                formatValue={formatCurrency}
              />

              {/* Lump sums */}
              <RangeSlider
                label="Car Cost (2028)"
                value={carCost}
                min={0}
                max={60000}
                step={2000}
                onChange={setCarCost}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Gift to Children"
                value={combinedGiftAmount}
                min={0}
                max={400000}
                step={5000}
                onChange={setCombinedGiftAmount}
                formatValue={formatCurrency}
              />

              {/* ISA & tax environment */}
              <RangeSlider
                label="ISA Contribution Cap per Year"
                value={isaContributionCap}
                min={5000}
                max={80000}
                step={5000}
                onChange={setIsaContributionCap}
                formatValue={formatCurrency}
              />
              <RangeSlider
                label="Recession Hit (%) on Property & ISA"
                value={recessionHitPct}
                min={0}
                max={50}
                step={1}
                onChange={setRecessionHitPct}
                formatValue={v => `${v}%`}
              />
              <RangeSlider
                label="CGT Rate on Surplus Pot"
                value={cgtRatePct}
                min={0}
                max={40}
                step={1}
                onChange={setCgtRatePct}
                formatValue={v => `${v}%`}
              />
            </div>
          )}
        </div>

        <div className="chart-top-row">
          {/* Inline summary tiles */}
          <div className="chart-summary-inline">
            <div className="chart-summary-tile">
              <div className="chart-summary-label">Total Cash</div>
              <div className="chart-summary-value">
                {formatCurrency(finalLiquidNet)}
              </div>
            </div>
            <div className="chart-summary-tile">
              <div className="chart-summary-label">Mortgage Paid</div>
              <div className="chart-summary-value">
                {formatCurrency(totalMortgagePayments)}
              </div>
            </div>
            <div className="chart-summary-tile">
              <div className="chart-summary-label">Property</div>
              <div className="chart-summary-value">
                {formatCurrency(finalPropertyValue)}
              </div>
            </div>
          </div>

          {/* Sliders with headings aligned over columns */}
          <div className="chart-sliders-inline">
            <div className="slider-header-row">
              <div className="slider-header">House & mortgages</div>
              <div className="slider-header">Income & growth</div>
              <div className="slider-header">Kids & shocks</div>
            </div>

            <div className="slider-columns-row">
              {/* Column 1 - House & mortgages */}
              <div className="slider-column">
                <RangeSlider
                  label="Initial Deposit"
                  value={initialDeposit}
                  min={0}
                  max={initialCash}
                  step={10000}
                  onChange={handleInitialDepositChange}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Initial Mortgage"
                  value={initialMortgage}
                  min={100000}
                  max={800000}
                  step={10000}
                  onChange={handleInitialMortgageChange}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Property Real Growth"
                  value={realGrowthProperty}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setRealGrowthProperty}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Interest Rate"
                  value={mortgageRate}
                  min={1}
                  max={10}
                  step={0.1}
                  onChange={setMortgageRate}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Salary % on Mortgage (up to second house)"
                  value={salaryMortgageEarly}
                  min={5}
                  max={30}
                  step={1}
                  onChange={setSalaryMortgageEarly}
                  formatValue={v => `${v}%`}
                />
              </div>

              {/* Column 2 - House & mortgages */}
              <div className="slider-column">
                <RangeSlider
                  label="Second House Deposit (from ISA)"
                  value={secondHouseDeposit}
                  min={0}
                  max={400000}
                  step={10000}
                  onChange={handleSecondHouseDepositChange}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Second Mortgage Amount"
                  value={secondMortgage}
                  min={0}
                  max={400000}
                  step={10000}
                  onChange={handleSecondMortgageChange}
                  formatValue={formatCurrency}
                />
                <RangeSlider
                  label="Salary % on Mortgage (after second house)"
                  value={salaryMortgageLater}
                  min={5}
                  max={50}
                  step={1}
                  onChange={setSalaryMortgageLater}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="Second House Purchase Year"
                  value={secondHouseYear}
                  min={2027}
                  max={2069}
                  step={1}
                  onChange={setSecondHouseYear}
                  formatValue={v => v}
                />
              </div>

              {/* Column 3 - Income & growth */}
              <div className="slider-column">
                <RangeSlider
                  label="Starting Income 1"
                  value={income1Start}
                  min={40000}
                  max={250000}
                  step={5000}
                  onChange={setIncome1Start}
                  formatValue={v => `£${(v / 1000).toFixed(0)}k`}
                />
                <RangeSlider
                  label="Starting Income 2"
                  value={income2Start}
                  min={40000}
                  max={250000}
                  step={5000}
                  onChange={setIncome2Start}
                  formatValue={v => `£${(v / 1000).toFixed(0)}k`}
                />
                <RangeSlider
                  label="Combined Income Real Growth"
                  value={incomeGrowth}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setIncomeGrowth}
                  formatValue={v => `${v}%`}
                />
              </div>

              {/* Column 4 - Income & growth */}
              <div className="slider-column">
                <RangeSlider
                  label="Living Costs Real Growth"
                  value={realGrowthCosts}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setRealGrowthCosts}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="ISA Real Growth"
                  value={isaGrowth}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={setIsaGrowth}
                  formatValue={v => `${v}%`}
                />
                <RangeSlider
                  label="ISA Seed (starting balance)"
                  value={isaSeed}
                  min={0}
                  max={initialCash}
                  step={5000}
                  onChange={handleIsaSeedChange}
                  formatValue={formatCurrency}
                />
              </div>

              {/* Column 5 - Kids & shocks */}
              <div className="slider-column">
                <RangeSlider
                  label="Child 1 Birth Year"
                  value={child1BirthYear}
                  min={2029}
                  max={2050}
                  step={1}
                  onChange={setChild1BirthYear}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Child 2 Birth Year"
                  value={child2BirthYear}
                  min={2030}
                  max={2052}
                  step={1}
                  onChange={setChild2BirthYear}
                  formatValue={v => v}
                />
              </div>

              {/* Column 6 - Kids & shocks */}
              <div className="slider-column">
                <RangeSlider
                  label="Recession Year 1"
                  value={recessionYear}
                  min={2027}
                  max={2069}
                  step={1}
                  onChange={setRecessionYear}
                  formatValue={v => v}
                />
                <RangeSlider
                  label="Recession Year 2"
                  value={secondRecessionYear}
                  min={2027}
                  max={2069}
                  step={1}
                  onChange={setSecondRecessionYear}
                  formatValue={v => v}
                />
              </div>
            </div>
          </div>

          <div className="toggle-row">
            <label className="line-toggle">
              <input
                type="checkbox"
                checked={lockHouseLink}
                onChange={toggleHouseLock}
              />
              Lock initial vs second house (same total)
            </label>
            <label className="line-toggle">
              <input
                type="checkbox"
                checked={usePrivateSchool}
                onChange={e => setUsePrivateSchool(e.target.checked)}
              />
              Private school age 11–18
            </label>
          </div>
        </div>

        <div className="derived-line derived-line-inline">
          Initial Property Value:{' '}
          <span className="derived-highlight">
            {formatCurrency(initialPropertyValue)}
          </span>
          {'  •  '}
          Second House Value (at move year):{' '}
          <span className="derived-highlight">
            {formatCurrency(secondHouseValue)}
          </span>
        </div>

        {/* Line toggles */}
        <div className="line-toggle-row">
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showIncomeLine}
              onChange={e => setShowIncomeLine(e.target.checked)}
            />
            Income
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showIsaLine}
              onChange={e => setShowIsaLine(e.target.checked)}
            />
            ISA
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showSurplusLine}
              onChange={e => setShowSurplusLine(e.target.checked)}
            />
            Surplus pot
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showMortgagePaidLine}
              onChange={e => setShowMortgagePaidLine(e.target.checked)}
            />
            Mortgage paid
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={showInterestLine}
              onChange={e => setShowInterestLine(e.target.checked)}
            />
            Interest paid
          </label>
          <label className="line-toggle">
            <input
              type="checkbox"
              checked={zoomOut}
              onChange={e => setZoomOut(e.target.checked)}
            />
            Zoom Out (Uncapped Chart)
          </label>
        </div>

        <div className="chart-main">
          {financialData && financialData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                  tickFormatter={formatCurrency}
                  domain={zoomOut ? ['auto', 'auto'] : [0, 600000]}
                  scale="sqrt"
                />
                <Tooltip formatter={value => formatCurrency(value)} />
                <Legend />

                {/* Milestones */}
                <ReferenceLine x={2028} stroke="#facc15" strokeDasharray="3 3" label="🚗" />
                <ReferenceLine x={child1BirthYear} stroke="#f9a8d4" strokeDasharray="3 3" label="👶1" />
                <ReferenceLine x={child2BirthYear} stroke="#f9a8d4" strokeDasharray="3 3" label="👶2" />
                <ReferenceLine x={secondHouseYear} stroke="#4ade80" strokeDasharray="3 3" label="🏠" />
                <ReferenceLine x={kid1GiftYear} stroke="#60a5fa" strokeDasharray="3 3" label="🎁1" />
                <ReferenceLine x={kid2GiftYear} stroke="#60a5fa" strokeDasharray="3 3" label="🎁2" />
                <ReferenceLine
                  x={recessionYear}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label="📉"
                />
                <ReferenceLine
                  x={secondRecessionYear}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label="📉2"
                />
                {mortgageRepayYear && (
                  <ReferenceLine
                    x={mortgageRepayYear}
                    stroke="#22c55e"
                    strokeDasharray="2 2"
                    label="✅"
                  />
                )}

                {/* Combined income (pre-tax) */}
                {showIncomeLine && (
                  <Line
                    type="monotone"
                    dataKey="combinedIncomeGross"
                    name="Combined Income (pre-tax)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                  >
                    <LabelList content={renderInlineNameLabel('Combined income', '#14b8a6')} />
                    <LabelList content={renderEndLabel('#14b8a6')} />
                  </Line>
                )}

                {/* Surplus pot */}
                {showSurplusLine && (
                  <Line
                    type="monotone"
                    dataKey="surplusPot"
                    name="Surplus Pot (after CGT)"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  >
                    <LabelList
                      content={renderInlineNameLabel('Surplus', '#0ea5e9')}
                    />
                    <LabelList content={renderEndLabel('#0ea5e9')} />
                  </Line>
                )}

                {/* ISA */}
                {showIsaLine && (
                  <Line
                    type="monotone"
                    dataKey="isaTotal"
                    name="ISA Total"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const below = payload.isaBelowThreshold;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={below ? 4 : 3}
                          fill={below ? '#dc2626' : '#8b5cf6'}
                          stroke="none"
                        />
                      );
                    }}
                  >
                    <LabelList content={renderInlineNameLabel('ISA', '#8b5cf6')} />
                    <LabelList content={renderEndLabel('#8b5cf6')} />
                  </Line>
                )}

                {/* Cumulative mortgage metrics (stop after payoff via *Display* keys) */}
                {showMortgagePaidLine && (
                  <Line
                    type="monotone"
                    dataKey="totalMortgagePaymentsDisplay"
                    name="Total Mortgage Payments (cumulative)"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={false}
                  >
                    <LabelList
                      content={renderInlineNameLabel('Mortgage paid', '#f97316')}
                    />
                    <LabelList content={renderEndLabel('#f97316')} />
                  </Line>
                )}

                {showInterestLine && (
                  <Line
                    type="monotone"
                    dataKey="totalInterestPaidDisplay"
                    name="Total Interest Paid (cumulative)"
                    stroke="#b91c1c"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls={false}
                  >
                    <LabelList
                      content={renderInlineNameLabel('Interest', '#b91c1c')}
                    />
                    <LabelList content={renderEndLabel('#b91c1c')} />
                  </Line>
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '20px', color: '#666' }}>Loading chart...</div>
          )}
        </div>

        <div className="milestones">
          <span>🚗 2028 - Car purchase ({formatCurrency(carCost)})</span>
          <span>👶1 {child1BirthYear} - Child 1 birth & mat leave</span>
          <span>👶2 {child2BirthYear} - Child 2 birth & mat leave</span>
          <span>🏠 {secondHouseYear} - Second house & extra mortgage</span>
          <span>
            🎁1 {kid1GiftYear} - Gift to child 1 ({formatCurrency(kid1GiftAmount)})
          </span>
          <span>
            🎁2 {kid2GiftYear} - Gift to child 2 ({formatCurrency(kid2GiftAmount)})
          </span>
          <span>
            📉 {recessionYear} - Recession (-{recessionHitPct}% property & ISA)
          </span>
          <span>
            📉2 {secondRecessionYear} - Second recession (-{recessionHitPct}% property & ISA)
          </span>
          {mortgageRepayYear && (
            <span>✅ {mortgageRepayYear} - Mortgage fully repaid</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
