import React, { useMemo } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PlannerChartSection = ({
  financialData,
  formatCurrency,
  firstHousePurchaseYear,
  child1BirthYear,
  child2BirthYear,
  effectiveSecondHouseYear,
  enableSecondHouse,
  kid1GiftYear,
  kid2GiftYear,
  recessionYear,
  secondRecessionYear,
  thirdRecessionYear,
  enableRedundancy,
  redundancyYear,
  secondRedundancyYear,
  mortgageRepayYear,
  firstMortgagePaidOffYear,
  showIncomeLine,
  showSurplusLine,
  showIsaLine,
  showMortgageBalanceLine,
  renderInlineNameLabel,
  renderEndLabel,
  pieData,
  showPieChart,
  carCost,
}) => {
  const chartData = useMemo(() => (
    (financialData ?? []).map((row) => {
      const isaChartValue = (row.isaTotal ?? 0) - (row.cumulativeShortfall ?? 0);

      return {
        ...row,
        isaChartValue,
        isaShortfallAmount: Math.max(0, -isaChartValue),
      };
    })
  ), [financialData]);

  const hasNegativeIsaPosition = chartData.some((row) => row.isaChartValue < 0);

  return (
    <>
    <div className="chart-visual-row">
      <div className="chart-main">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis
                tickFormatter={formatCurrency}
                domain={['auto', 'auto']}
                scale={hasNegativeIsaPosition ? 'linear' : 'sqrt'}
              />
              <Tooltip
                formatter={(value, name, item) => {
                  if (item?.dataKey === 'isaChartValue') {
                    return [
                      formatCurrency(value),
                      item.payload?.isaShortfallAmount > 0
                        ? 'ISA position (negative = shortfall)'
                        : 'ISA position',
                    ];
                  }

                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              {hasNegativeIsaPosition && (
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              )}

              <ReferenceLine x={firstHousePurchaseYear} stroke="#6366f1" strokeDasharray="2 3" label="🏡" />
              <ReferenceLine x={2028} stroke="#facc15" strokeDasharray="3 3" label="🚗" />
              <ReferenceLine x={child1BirthYear} stroke="#f9a8d4" strokeDasharray="3 3" label="👶1" />
              <ReferenceLine x={child2BirthYear} stroke="#f9a8d4" strokeDasharray="3 3" label="👶2" />
              {enableSecondHouse && (
                <ReferenceLine x={effectiveSecondHouseYear} stroke="#4ade80" strokeDasharray="3 3" label="🏠" />
              )}
              <ReferenceLine x={kid1GiftYear} stroke="#60a5fa" strokeDasharray="3 3" label="🎁1" />
              <ReferenceLine x={kid2GiftYear} stroke="#60a5fa" strokeDasharray="3 3" label="🎁2" />
              <ReferenceLine x={recessionYear} stroke="#94a3b8" strokeDasharray="4 4" label="📉" />
              <ReferenceLine x={secondRecessionYear} stroke="#94a3b8" strokeDasharray="4 4" label="📉2" />
              <ReferenceLine x={thirdRecessionYear} stroke="#94a3b8" strokeDasharray="4 4" label="📉3" />
              {enableRedundancy && (
                <ReferenceLine x={redundancyYear} stroke="#ef4444" strokeDasharray="4 3" label="R1" />
              )}
              {enableRedundancy && (
                <ReferenceLine x={secondRedundancyYear} stroke="#ef4444" strokeDasharray="4 3" label="R2" />
              )}
              {mortgageRepayYear && (
                <ReferenceLine
                  x={mortgageRepayYear}
                  stroke="#22c55e"
                  strokeDasharray="2 2"
                  label="✅"
                />
              )}
              {firstMortgagePaidOffYear && (
                <ReferenceLine
                  x={firstMortgagePaidOffYear}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  label="✅1"
                />
              )}

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

              {showSurplusLine && (
                <Line
                  type="monotone"
                  dataKey="surplusPot"
                  name="Surplus Savings"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                >
                  <LabelList content={renderInlineNameLabel('Surplus savings', '#0ea5e9')} />
                  <LabelList content={renderEndLabel('#0ea5e9')} />
                </Line>
              )}

              {showIsaLine && (
                <Line
                  type="monotone"
                  dataKey="isaChartValue"
                  name="ISA Position"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const below = payload.isaBelowThreshold;
                    const negative = payload.isaChartValue < 0;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={negative ? 4.5 : below ? 4 : 3}
                        fill={negative ? '#b91c1c' : below ? '#dc2626' : '#8b5cf6'}
                        stroke="none"
                      />
                    );
                  }}
                >
                  <LabelList content={renderInlineNameLabel('ISA position', '#8b5cf6')} />
                  <LabelList content={renderEndLabel('#8b5cf6')} />
                </Line>
              )}

              {showMortgageBalanceLine && (
                <Line
                  type="monotone"
                  dataKey="mortgageBalance"
                  name="Mortgage Value"
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  connectNulls={false}
                >
                  <LabelList content={renderInlineNameLabel('Mortgage balance', '#dc2626')} />
                  <LabelList content={renderEndLabel('#dc2626')} />
                </Line>
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: '20px', color: '#666' }}>Loading chart...</div>
        )}
      </div>

      {showPieChart && (
        <div className="pie-chart-container pie-chart-inline">
          <h3 className="pie-chart-title">Final Financial Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                outerRadius={72}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    <div className="milestones">
      <span>🏡 {firstHousePurchaseYear} - First house completion</span>
      <span>🚗 2028 - Car purchase ({formatCurrency(carCost)})</span>
      <span>👶1 {child1BirthYear} - Child 1 birth & mat leave</span>
      <span>👶2 {child2BirthYear} - Child 2 birth & mat leave</span>
      {enableSecondHouse && (
        <span>🏠 {effectiveSecondHouseYear} - Second house & extra mortgage</span>
      )}
      <span>🎁1 {kid1GiftYear} - Gift to child 1</span>
      <span>🎁2 {kid2GiftYear} - Gift to child 2</span>
      <span>📉 {recessionYear} - Recession</span>
      <span>📉2 {secondRecessionYear} - Second recession</span>
      <span>📉3 {thirdRecessionYear} - Third recession</span>
      {enableRedundancy && (
        <span>R1 {redundancyYear} - Person 1 redundancy year</span>
      )}
      {enableRedundancy && (
        <span>R2 {secondRedundancyYear} - Person 1 second redundancy year</span>
      )}
      {firstMortgagePaidOffYear && (
        <span>✅1 {firstMortgagePaidOffYear} - First mortgage fully repaid</span>
      )}
      {mortgageRepayYear && (
        <span>✅ {mortgageRepayYear} - All mortgages fully repaid</span>
      )}
    </div>
    </>
  );
};

export default PlannerChartSection;
