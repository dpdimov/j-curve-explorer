import React, { useState, useMemo } from 'react';

const JCurveExplorer = () => {
  // Business model presets
  const presets = {
    custom: {
      name: 'Custom',
      initialCapital: 500,
      monthlyBurn: 50,
      monthsToRevenue: 12,
      revenueRampRate: 15,
      grossMargin: 60,
      description: 'Adjust parameters to explore different scenarios'
    },
    saas: {
      name: 'SaaS Platform',
      initialCapital: 200,
      monthlyBurn: 30,
      monthsToRevenue: 6,
      revenueRampRate: 20,
      grossMargin: 80,
      description: 'Asset-light, quick to market, high margins. The shallow, narrow J.'
    },
    biotech: {
      name: 'Biotech / Pharma',
      initialCapital: 2000,
      monthlyBurn: 150,
      monthsToRevenue: 36,
      revenueRampRate: 40,
      grossMargin: 85,
      description: 'Massive R&D spend, regulatory hurdles, then explosive growth. The deep, wide J.'
    },
    hardware: {
      name: 'Hardware / Manufacturing',
      initialCapital: 1500,
      monthlyBurn: 100,
      monthsToRevenue: 24,
      revenueRampRate: 12,
      grossMargin: 35,
      description: 'Heavy capex, tooling costs, slower scaling. Deep trough, gradual recovery.'
    },
    marketplace: {
      name: 'Marketplace',
      initialCapital: 800,
      monthlyBurn: 80,
      monthsToRevenue: 18,
      revenueRampRate: 25,
      grossMargin: 70,
      description: 'Chicken-and-egg problem requires sustained investment before network effects.'
    },
    consulting: {
      name: 'Consulting / Services',
      initialCapital: 100,
      monthlyBurn: 15,
      monthsToRevenue: 3,
      revenueRampRate: 8,
      grossMargin: 50,
      description: 'Low capital needs, quick revenue, but slower scaling. The shallow J.'
    }
  };

  const [selectedPreset, setSelectedPreset] = useState('saas');
  const [params, setParams] = useState(presets.saas);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPreset, setComparisonPreset] = useState('biotech');

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'custom') {
      setParams(presets[presetKey]);
    }
  };

  const handleParamChange = (param, value) => {
    setSelectedPreset('custom');
    setParams(prev => ({ ...prev, ...presets.custom, [param]: value }));
  };

  // Calculate J-curve data points
  const calculateCurve = (p) => {
    const points = [];
    let cumulativeCash = 0;
    const totalMonths = 60;

    for (let month = 0; month <= totalMonths; month++) {
      if (month === 0) {
        cumulativeCash = -p.initialCapital;
      } else if (month <= p.monthsToRevenue) {
        // Pre-revenue: just burning cash
        cumulativeCash -= p.monthlyBurn;
      } else {
        // Post-revenue: revenue grows, costs continue
        const monthsSinceRevenue = month - p.monthsToRevenue;
        const monthlyRevenue = p.revenueRampRate * monthsSinceRevenue * (p.grossMargin / 100);
        const netCashFlow = monthlyRevenue - p.monthlyBurn;
        cumulativeCash += netCashFlow;
      }
      points.push({ month, cash: cumulativeCash });
    }
    return points;
  };

  const curveData = useMemo(() => calculateCurve(params), [params]);
  const comparisonData = useMemo(() =>
    showComparison ? calculateCurve(presets[comparisonPreset]) : [],
    [showComparison, comparisonPreset]
  );

  // Calculate key metrics
  const metrics = useMemo(() => {
    const minCash = Math.min(...curveData.map(p => p.cash));
    const breakEvenMonth = curveData.findIndex(p => p.cash >= 0 && curveData[curveData.indexOf(p) - 1]?.cash < 0);
    const totalFundingNeeded = Math.abs(minCash);
    const avgPreRevenueBurn = params.monthlyBurn;
    const peakBurnMonth = params.monthsToRevenue;

    return {
      totalFundingNeeded: totalFundingNeeded.toFixed(0),
      breakEvenMonth: breakEvenMonth > 0 ? breakEvenMonth : 'Beyond 60',
      peakDeficit: Math.abs(minCash).toFixed(0),
      monthsOfRunway: Math.ceil(totalFundingNeeded / params.monthlyBurn),
      avgBurnRate: avgPreRevenueBurn
    };
  }, [curveData, params]);

  // SVG Chart dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale calculations
  const allCashValues = [...curveData.map(p => p.cash), ...(showComparison ? comparisonData.map(p => p.cash) : [])];
  const minY = Math.min(...allCashValues, 0);
  const maxY = Math.max(...allCashValues, 0);
  const yRange = maxY - minY || 1;

  const scaleX = (month) => padding.left + (month / 60) * chartWidth;
  const scaleY = (cash) => padding.top + chartHeight - ((cash - minY) / yRange) * chartHeight;

  // Generate path
  const generatePath = (data) => {
    return data.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${scaleX(p.month)} ${scaleY(p.cash)}`
    ).join(' ');
  };

  // Generate area path (for fill)
  const generateAreaPath = (data) => {
    const linePath = generatePath(data);
    const zeroY = scaleY(0);
    return `${linePath} L ${scaleX(60)} ${zeroY} L ${scaleX(0)} ${zeroY} Z`;
  };

  const zeroLineY = scaleY(0);

  return (
    <div className="page-wrapper" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
      color: '#1e293b',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .preset-btn {
          padding: 12px 20px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 8px;
        }
        .preset-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #1e293b;
        }
        .preset-btn.active {
          background: linear-gradient(135deg, rgba(99, 179, 237, 0.15), rgba(129, 140, 248, 0.15));
          border-color: rgba(99, 179, 237, 0.4);
          color: #2563eb;
          box-shadow: 0 0 20px rgba(99, 179, 237, 0.1);
        }

        .slider-container {
          margin-bottom: 24px;
        }
        .slider-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          color: #888;
        }
        .slider-value {
          font-family: 'IBM Plex Mono', monospace;
          color: #2563eb;
          font-weight: 500;
        }
        input[type="range"] {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: #e2e8f0;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(99, 179, 237, 0.4);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .metric-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .metric-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 28px;
          font-weight: 500;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .metric-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .toggle-btn {
          padding: 10px 16px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 6px;
        }
        .toggle-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .toggle-btn.active {
          background: rgba(236, 72, 153, 0.15);
          border-color: rgba(236, 72, 153, 0.4);
          color: #db2777;
        }

        .comparison-select {
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #1e293b;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          outline: none;
        }
        .comparison-select:focus {
          border-color: rgba(236, 72, 153, 0.4);
        }

        .main-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 48px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .chart-container {
          width: 100%;
          overflow: hidden;
        }
        .chart-container svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .page-title {
          font-size: 42px;
        }
        .page-wrapper {
          padding: 40px;
        }

        @media (max-width: 900px) {
          .main-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .page-title {
            font-size: 28px;
          }
          .page-wrapper {
            padding: 20px;
          }
          .metric-value {
            font-size: 22px;
          }
          .metric-label {
            font-size: 10px;
          }
          .preset-btn {
            padding: 10px 14px;
            font-size: 12px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 className="page-title" style={{
            fontWeight: 300,
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            J-Curve Explorer
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            maxWidth: '600px',
            lineHeight: 1.6
          }}>
            Visualise how business model choices shape funding requirements.
            The curve's depth reveals capital intensity; its width exposes time-to-revenue.
          </p>
        </div>

        {/* Preset Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          {Object.entries(presets).filter(([key]) => key !== 'custom').map(([key, preset]) => (
            <button
              key={key}
              className={`preset-btn ${selectedPreset === key ? 'active' : ''}`}
              onClick={() => handlePresetChange(key)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{
          background: 'rgba(99, 179, 237, 0.05)',
          border: '1px solid rgba(99, 179, 237, 0.15)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px',
          fontSize: '14px',
          color: '#64748b',
          lineHeight: 1.6
        }}>
          <span style={{ color: '#2563eb', fontWeight: 500 }}>
            {presets[selectedPreset]?.name || 'Custom'}:
          </span>{' '}
          {presets[selectedPreset]?.description || params.description}
        </div>

        <div className="main-layout">
          {/* Controls Panel */}
          <div>
            <h3 style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#94a3b8',
              marginBottom: '24px'
            }}>
              Parameters
            </h3>

            <div className="slider-container">
              <div className="slider-label">
                <span>Initial Capital Required</span>
                <span className="slider-value">£{params.initialCapital}k</span>
              </div>
              <input
                type="range"
                min="50"
                max="3000"
                step="50"
                value={params.initialCapital}
                onChange={(e) => handleParamChange('initialCapital', Number(e.target.value))}
              />
            </div>

            <div className="slider-container">
              <div className="slider-label">
                <span>Monthly Burn Rate</span>
                <span className="slider-value">£{params.monthlyBurn}k</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                step="5"
                value={params.monthlyBurn}
                onChange={(e) => handleParamChange('monthlyBurn', Number(e.target.value))}
              />
            </div>

            <div className="slider-container">
              <div className="slider-label">
                <span>Months to First Revenue</span>
                <span className="slider-value">{params.monthsToRevenue} months</span>
              </div>
              <input
                type="range"
                min="1"
                max="48"
                step="1"
                value={params.monthsToRevenue}
                onChange={(e) => handleParamChange('monthsToRevenue', Number(e.target.value))}
              />
            </div>

            <div className="slider-container">
              <div className="slider-label">
                <span>Revenue Ramp Rate</span>
                <span className="slider-value">£{params.revenueRampRate}k/mo growth</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={params.revenueRampRate}
                onChange={(e) => handleParamChange('revenueRampRate', Number(e.target.value))}
              />
            </div>

            <div className="slider-container">
              <div className="slider-label">
                <span>Gross Margin</span>
                <span className="slider-value">{params.grossMargin}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={params.grossMargin}
                onChange={(e) => handleParamChange('grossMargin', Number(e.target.value))}
              />
            </div>

            {/* Comparison Toggle */}
            <div style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <h3 style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#94a3b8',
                marginBottom: '16px'
              }}>
                Compare
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  className={`toggle-btn ${showComparison ? 'active' : ''}`}
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </button>
                {showComparison && (
                  <select
                    className="comparison-select"
                    value={comparisonPreset}
                    onChange={(e) => setComparisonPreset(e.target.value)}
                  >
                    {Object.entries(presets)
                      .filter(([key]) => key !== 'custom' && key !== selectedPreset)
                      .map(([key, preset]) => (
                        <option key={key} value={key}>{preset.name}</option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div>
            {/* Metrics Row */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">£{metrics.totalFundingNeeded}k</div>
                <div className="metric-label">Total Funding Needed</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: '#db2777' }}>{metrics.breakEvenMonth}</div>
                <div className="metric-label">Break-Even (Months)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">£{metrics.avgBurnRate}k</div>
                <div className="metric-label">Monthly Burn</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: '#16a34a' }}>{metrics.monthsOfRunway}</div>
                <div className="metric-label">Months Runway Needed</div>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="chart-container" style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[...Array(7)].map((_, i) => {
                  const y = padding.top + (chartHeight / 6) * i;
                  return (
                    <line
                      key={`grid-${i}`}
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Zero line */}
                <line
                  x1={padding.left}
                  y1={zeroLineY}
                  x2={width - padding.right}
                  y2={zeroLineY}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />

                {/* Comparison curve (if shown) */}
                {showComparison && comparisonData.length > 0 && (
                  <>
                    <path
                      d={generateAreaPath(comparisonData)}
                      fill="url(#comparisonGradient)"
                      opacity="0.3"
                    />
                    <path
                      d={generatePath(comparisonData)}
                      fill="none"
                      stroke="#db2777"
                      strokeWidth="2"
                      opacity="0.6"
                      strokeDasharray="6,4"
                    />
                  </>
                )}

                {/* Main curve area fill */}
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="comparisonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#db2777" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#db2777" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d={generateAreaPath(curveData)}
                  fill="url(#curveGradient)"
                />

                {/* Main curve */}
                <path
                  d={generatePath(curveData)}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>

                {/* Trough marker */}
                {(() => {
                  const minPoint = curveData.reduce((min, p) => p.cash < min.cash ? p : min, curveData[0]);
                  return (
                    <>
                      <circle
                        cx={scaleX(minPoint.month)}
                        cy={scaleY(minPoint.cash)}
                        r="6"
                        fill="#dc2626"
                        stroke="#f8fafc"
                        strokeWidth="2"
                      />
                      <text
                        x={scaleX(minPoint.month)}
                        y={scaleY(minPoint.cash) + 24}
                        fill="#dc2626"
                        fontSize="11"
                        fontFamily="IBM Plex Mono"
                        textAnchor="middle"
                      >
                        Peak deficit: £{Math.abs(minPoint.cash).toFixed(0)}k
                      </text>
                    </>
                  );
                })()}

                {/* Revenue start marker */}
                <line
                  x1={scaleX(params.monthsToRevenue)}
                  y1={padding.top}
                  x2={scaleX(params.monthsToRevenue)}
                  y2={height - padding.bottom}
                  stroke="#16a34a"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.5"
                />
                <text
                  x={scaleX(params.monthsToRevenue)}
                  y={padding.top - 10}
                  fill="#16a34a"
                  fontSize="10"
                  fontFamily="IBM Plex Sans"
                  textAnchor="middle"
                >
                  First Revenue
                </text>

                {/* X-axis labels */}
                {[0, 12, 24, 36, 48, 60].map(month => (
                  <text
                    key={month}
                    x={scaleX(month)}
                    y={height - padding.bottom + 24}
                    fill="#666"
                    fontSize="11"
                    fontFamily="IBM Plex Mono"
                    textAnchor="middle"
                  >
                    {month === 0 ? 'Launch' : `M${month}`}
                  </text>
                ))}

                {/* Y-axis labels */}
                {(() => {
                  const yTicks = [];
                  const step = yRange / 4;
                  for (let i = 0; i <= 4; i++) {
                    const val = minY + step * i;
                    yTicks.push(val);
                  }
                  return yTicks.map((val, i) => (
                    <text
                      key={i}
                      x={padding.left - 12}
                      y={scaleY(val) + 4}
                      fill="#666"
                      fontSize="11"
                      fontFamily="IBM Plex Mono"
                      textAnchor="end"
                    >
                      {val >= 0 ? '£' : '-£'}{Math.abs(val / 1000).toFixed(1)}m
                    </text>
                  ));
                })()}

                {/* Axis labels */}
                <text
                  x={width / 2}
                  y={height - 8}
                  fill="#888"
                  fontSize="12"
                  fontFamily="IBM Plex Sans"
                  textAnchor="middle"
                >
                  Time (Months)
                </text>
                <text
                  x={-height / 2}
                  y={20}
                  fill="#888"
                  fontSize="12"
                  fontFamily="IBM Plex Sans"
                  textAnchor="middle"
                  transform="rotate(-90)"
                >
                  Cumulative Cash Flow
                </text>

                {/* Legend */}
                {showComparison && (
                  <g transform={`translate(${width - padding.right - 140}, ${padding.top + 10})`}>
                    <rect
                      x="-10"
                      y="-10"
                      width="150"
                      height="50"
                      fill="#f1f5f9"
                      stroke="#e2e8f0"
                      rx="6"
                    />
                    <line x1="0" y1="5" x2="30" y2="5" stroke="#2563eb" strokeWidth="2" />
                    <text x="40" y="9" fill="#1e293b" fontSize="11">{presets[selectedPreset]?.name || 'Current'}</text>
                    <line x1="0" y1="25" x2="30" y2="25" stroke="#db2777" strokeWidth="2" strokeDasharray="6,4" />
                    <text x="40" y="29" fill="#1e293b" fontSize="11">{presets[comparisonPreset]?.name}</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Insights */}
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: '13px',
              color: '#64748b',
              lineHeight: 1.7
            }}>
              <strong style={{ color: '#64748b' }}>Reading the curve:</strong> The
              <span style={{ color: '#dc2626' }}> depth</span> of the trough (£{metrics.peakDeficit}k) represents your total funding requirement—
              money you must raise before the business sustains itself. The
              <span style={{ color: '#2563eb' }}> slope</span> of descent is your burn rate. The
              <span style={{ color: '#16a34a' }}> width</span> of the trough ({params.monthsToRevenue} months to revenue)
              reflects R&D cycles and time-to-market. Steeper recovery curves indicate higher gross margins
              and faster revenue scaling.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JCurveExplorer;
