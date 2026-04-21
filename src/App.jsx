import { useEffect, useState } from 'react';
import { workbookGroups } from './data/workbooks.js';

const menuItems = [
  { id: 'overview', icon: 'snapshot', label: 'Career Snapshot' },
  { id: 'enrollment', icon: 'education', label: 'SHS to Degree' },
  { id: 'employment', icon: 'jobs', label: 'Graduate Jobs' },
  { id: 'trajectory', icon: 'flow', label: 'Career Flow' },
];

const strandColors = {
  STEM: '#071126',
  ABM: '#3b82f6',
  HUMSS: '#10b981',
  GAS: '#f59e0b',
  ICT: '#8b5cf6',
};

const fieldColors = [
  '#071126',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#64748b',
];

const flowStrandColors = {
  STEM: '#0ea5e9',
  ABM: '#3b82f6',
  HUMSS: '#10b981',
  GAS: '#f59e0b',
  ICT: '#8b5cf6',
};

const flowFieldColors = [
  '#0ea5e9',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#64748b',
];

const yearPairs = {
  All: { enrollmentYear: null, graduationYear: null, label: 'All Years' },
  2019: { enrollmentYear: '2019', graduationYear: '2023' },
  2020: { enrollmentYear: '2020', graduationYear: '2024' },
  2021: { enrollmentYear: '2021', graduationYear: '2025' },
  2023: { enrollmentYear: '2019', graduationYear: '2023' },
  2024: { enrollmentYear: '2020', graduationYear: '2024' },
  2025: { enrollmentYear: '2021', graduationYear: '2025' },
};

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [selectedStrand, setSelectedStrand] = useState('All Strands');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [data, setData] = useState({ enrollment: [], employment: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const loadedGroups = await Promise.all(
        workbookGroups.map(async (group) => {
          const files = await Promise.all(
            group.files.map(async (file) => {
              const response = await fetch(file.jsonPath);
              const rows = await response.json();
              return rows.map((row) => ({ ...row, source_year: file.year }));
            }),
          );

          return [group.id, files.flat()];
        }),
      );

      const nextData = Object.fromEntries(loadedGroups);
      setData({
        enrollment: nextData['student-enrollment'] ?? [],
        employment: nextData['graduate-employment'] ?? [],
      });
      setIsLoading(false);
    }

    loadDashboardData();
  }, []);

  const enrollmentById = new Map(
    data.enrollment.map((row) => [String(row.student_id), row]),
  );
  const careerRecords = data.employment.map((job) => ({
    ...job,
    enrollment: enrollmentById.get(String(job.student_id)),
  }));
  const availableStrands = countBy(data.enrollment, 'shs_strand').map((item) => item.label);
  const selectedYear = 'All';
  const yearContext = yearPairs[selectedYear];
  const matchesSelectedStrand = (strand) =>
    selectedStrand === 'All Strands' || strand === selectedStrand;
  const filteredEnrollment = data.enrollment.filter(
    (row) =>
      (!yearContext.enrollmentYear || String(row.entering_year) === yearContext.enrollmentYear) &&
      matchesSelectedStrand(row.shs_strand),
  );
  const filteredCareerRecords = careerRecords.filter(
    (row) =>
      (!yearContext.graduationYear || String(row.graduation_year) === yearContext.graduationYear) &&
      matchesSelectedStrand(row.enrollment?.shs_strand),
  );
  const filteredEmployment = filteredCareerRecords.map(({ enrollment, ...job }) => job);
  const graduateRows = filteredCareerRecords.map((row) => ({
    ...row,
    shs_strand: row.enrollment?.shs_strand ?? 'Unmapped',
  })).filter((row) => row.shs_strand !== 'Unmapped');
  const selectedYearLabel = yearContext.label ?? selectedYear;
  const alignedCount = filteredCareerRecords.filter(
    (row) => row.match_or_mismatch === 'Match',
  ).length;
  const alignmentRate = filteredCareerRecords.length
    ? Math.round((alignedCount / filteredCareerRecords.length) * 100)
    : 0;
  return (
    <main className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <button
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="brand-block"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          type="button"
        >
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path d="M4 11.2 12 4l8 7.2v8.3a.5.5 0 0 1-.5.5h-5v-5.5h-5V20h-5a.5.5 0 0 1-.5-.5z" />
            </svg>
          </span>
          <div className="brand-text">
            <strong>Dashboard</strong>
          </div>
        </button>

        <nav className="menu-list" aria-label="Dashboard sections">
          {menuItems.map((item) => (
            <button
              className={activeView === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span className="menu-icon" aria-hidden="true">
                <MenuIcon name={item.icon} />
              </span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="content-panel">
        <header className="content-header">
          <div>
            <h1>Education to Employment Pipeline Dashboard</h1>
          </div>
          <div className="header-actions">
            <select
              aria-label="Select SHS strand"
              onChange={(event) => setSelectedStrand(event.target.value)}
              value={selectedStrand}
            >
              <option>All Strands</option>
              {availableStrands.map((strand) => (
                <option key={strand}>{strand}</option>
              ))}
            </select>
          </div>
        </header>

        {isLoading ? (
          <section className="empty-state">Loading dashboard data...</section>
        ) : (
          <div className="view-stage" key={`${activeView}-${selectedStrand}`}>
            {activeView === 'overview' && (
              <OverviewView
                alignmentRate={alignmentRate}
                enrollment={filteredEnrollment}
                employment={filteredEmployment}
                graduationYear={yearContext.graduationYear}
                graduateRows={graduateRows}
                selectedStrand={selectedStrand}
                selectedYearLabel={selectedYearLabel}
              />
            )}

            {activeView === 'enrollment' && (
              <EnrollmentView
                enrollment={filteredEnrollment}
                selectedStrand={selectedStrand}
                year={yearContext.enrollmentYear ?? 'All Years'}
              />
            )}

            {activeView === 'employment' && (
              <EmploymentView
                alignmentRate={alignmentRate}
                careerRecords={filteredCareerRecords}
                employment={filteredEmployment}
                year={yearContext.graduationYear ?? 'All Years'}
              />
            )}

            {activeView === 'trajectory' && (
              <TrajectoryView
                careerRecords={filteredCareerRecords}
                graduationYear={yearContext.graduationYear ?? 'All Years'}
                selectedStrand={selectedStrand}
              />
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function OverviewView({
  alignmentRate,
  enrollment,
  employment,
  graduationYear,
  graduateRows,
  selectedStrand,
  selectedYearLabel,
}) {
  const totalEnrollment = enrollment.length;
  const totalGraduates = employment.length;

  return (
    <>
      <section className="kpi-grid" aria-label="Key metrics">
        <MetricCard detail={`${selectedYearLabel} selected filter`} label="Enrollment records" value={totalEnrollment} />
        <MetricCard detail={`${graduationYear ?? 'All Years'} paired outcomes`} label="Graduate records" value={totalGraduates} />
        <MetricCard detail={`${selectedStrand} career fit`} label="Job alignment" value={`${alignmentRate}%`} />
      </section>

      <section className="dashboard-grid">
        <ChartCard className="wide" eyebrow="Enrollment" title={`${selectedYearLabel} SHS enrollment profile`}>
          <MultiLineTrendChart
            colors={strandColors}
            data={enrollment}
            groupKey="shs_strand"
            yAxisLabel="Students"
            yearKey="entering_year"
          />
        </ChartCard>

        <ChartCard eyebrow="Enrollment mix" title={`${selectedYearLabel} SHS strand distribution`}>
          <DonutChart
            colors={strandColors}
            data={countBy(enrollment, 'shs_strand')}
            centerLabel={`${enrollment.length}`}
            subLabel="students"
          />
        </ChartCard>

        <ChartCard className="wide" eyebrow="Graduation" title={`${selectedYearLabel} graduate outcome profile`}>
          <MultiLineTrendChart
            colors={strandColors}
            data={graduateRows}
            groupKey="shs_strand"
            yAxisLabel="Graduates"
            yearKey="graduation_year"
          />
        </ChartCard>

        <ChartCard eyebrow="Graduation mix" title={`${selectedYearLabel} graduate strand distribution`}>
          <DonutChart
            colors={strandColors}
            data={countBy(graduateRows, 'shs_strand')}
            centerLabel={`${graduateRows.length}`}
            subLabel="graduates"
          />
        </ChartCard>
      </section>
    </>
  );
}

function EnrollmentView({ enrollment, selectedStrand, year }) {
  return (
    <section className="dashboard-grid">
      <ChartCard className="wide" eyebrow="Undergraduate field" title={`${year} undergraduate field distribution`}>
        <DonutChart
          colors={fieldColorMap(enrollment, 'undergraduate_field')}
          data={countBy(enrollment, 'undergraduate_field')}
          centerLabel={`${enrollment.length}`}
          subLabel="students"
          variant="splitLarge"
        />
      </ChartCard>

      <ChartCard eyebrow="Degree fit" title="Enrollment match ratio">
        <DonutChart
          data={countBy(enrollment, 'match_or_mismatch')}
          centerLabel={`${percentOf(enrollment, 'match_or_mismatch', 'Match')}%`}
          subLabel="matched"
        />
      </ChartCard>

      <ChartCard className="full" eyebrow="Academic path" title={`${year} SHS strand to field to program flow`}>
        <FlowDiagram
          colors={strandColors}
          columns={[
            { key: 'shs_strand', title: 'SHS Strand' },
            { key: 'undergraduate_field', title: 'Undergraduate Field' },
            { key: 'undergraduate_program', title: 'Specific Program' },
          ]}
          data={enrollment}
          limitPerColumn={[4, 5, 16]}
        />
      </ChartCard>
    </section>
  );
}

function EmploymentView({ alignmentRate, careerRecords, employment, year }) {
  return (
    <section className="dashboard-grid">
      <ChartCard eyebrow="Graduate job alignment" title={`${year} degree-aligned positions`}>
        <Gauge value={alignmentRate} />
      </ChartCard>

      <ChartCard className="wide" eyebrow="Industries" title={`${year} top industry sectors`}>
        <RankedBars data={countBy(employment, 'industry').slice(0, 7)} />
      </ChartCard>

      <ChartCard className="full" eyebrow="Employment path" title={`${year} node-link diagram: fields to industries`}>
        <FlowDiagram
          colors={fieldColorMap(careerRecords, 'undergraduate_field')}
          columns={[
            { key: 'undergraduate_field', title: 'Undergraduate Field' },
            { key: 'industry', title: 'Industry Sector' },
          ]}
          data={employment}
          limitPerColumn={[8, 7]}
        />
      </ChartCard>
    </section>
  );
}

function TrajectoryView({ careerRecords, graduationYear, selectedStrand }) {
  const trajectoryRecords = careerRecords
    .filter((row) => row.enrollment)
    .map((row) => ({
      shs_strand: row.enrollment.shs_strand,
      undergraduate_field: row.undergraduate_field,
      job_position: row.job_position,
      employer: row.employer,
    }));
  const undergraduateColors = fieldColorMap(
    trajectoryRecords,
    'undergraduate_field',
    flowFieldColors,
  );
  const trajectoryColors = {
    ...flowStrandColors,
    ...undergraduateColors,
    ...dominantColorMap(
      trajectoryRecords,
      'job_position',
      'undergraduate_field',
      undergraduateColors,
    ),
    ...dominantColorMap(
      trajectoryRecords,
      'employer',
      'undergraduate_field',
      undergraduateColors,
    ),
  };

  return (
    <section className="dashboard-grid">
      <ChartCard className="full tall" eyebrow="Career path" title={`${graduationYear} ${selectedStrand} career trajectory flow`}>
        <FlowDiagram
          colors={trajectoryColors}
          columns={[
            { key: 'shs_strand', title: 'SHS Strand' },
            { key: 'undergraduate_field', title: 'Undergraduate Field' },
            { key: 'job_position', title: 'Job Position' },
            { key: 'employer', title: 'Employer' },
          ]}
          data={trajectoryRecords}
          limitPerColumn={[4, 6, 9, 10]}
        />
      </ChartCard>
    </section>
  );
}

function SourcesView() {
  return (
    <section className="data-section">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Data inventory</p>
          <h2>JSON source folders</h2>
        </div>
      </div>

      <div className="source-grid">
        {workbookGroups.map((group) => (
          <article className="source-card" key={group.id}>
            <div>
              <p className="source-type">{group.label}</p>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>

            <ul className="file-list">
              {group.files.map((file) => (
                <li key={file.name}>
                  <a href={file.jsonPath}>{file.name.replace('.xlsx', '.json')}</a>
                  <span>{file.year}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ detail, label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ChartCard({ children, className = '', eyebrow, title }) {
  return (
    <article className={`chart-card ${className}`}>
      <div className="card-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </article>
  );
}

function MenuIcon({ name }) {
  if (name === 'education') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 8.5 12 4l9 4.5-9 4.5z" />
        <path d="M6.5 11.2v4.2c1.7 1.7 9.3 1.7 11 0v-4.2" />
      </svg>
    );
  }

  if (name === 'jobs') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M8.5 7V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7" />
        <path d="M4 8h16v10.2A1.8 1.8 0 0 1 18.2 20H5.8A1.8 1.8 0 0 1 4 18.2z" />
        <path d="M4 12.2h16M10 12.2v1.3h4v-1.3" />
      </svg>
    );
  }

  if (name === 'flow') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 6.5h5.5M13.5 6.5H19M5 17.5h5.5M13.5 17.5H19" />
        <path d="M10.5 6.5c2 0 2 11 4 11M10.5 17.5c2 0 2-11 4-11" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 19V9M12 19V5M19 19v-7" />
      <path d="M4 19.5h16" />
    </svg>
  );
}

function MultiLineTrendChart({ colors, data, groupKey, yAxisLabel, yearKey }) {
  const years = [...new Set(data.map((row) => String(row[yearKey])))].sort();
  const groups = [...new Set(data.map((row) => row[groupKey]).filter(Boolean))];
  const series = groups.map((group) => ({
    group,
    values: years.map((year) => data.filter((row) => String(row[yearKey]) === year && row[groupKey] === group).length),
  }));
  const max = Math.max(...series.flatMap((item) => item.values), 1);
  const yTicks = [max, Math.round(max * 0.67), Math.round(max * 0.33), 0];

  return (
    <div className="trend-chart">
      <svg viewBox="0 0 760 300" role="img" aria-label="SHS enrollment trend chart">
        <text className="axis-title" transform="rotate(-90)" x="-168" y="15">
          {yAxisLabel}
        </text>
        {[0, 1, 2, 3].map((line) => (
          <line className="grid-line" key={line} x1="70" x2="728" y1={50 + line * 62} y2={50 + line * 62} />
        ))}
        {yTicks.map((tick, index) => (
          <text className="axis-text y-axis-text" key={`${tick}-${index}`} x="58" y={54 + index * 62}>
            {tick}
          </text>
        ))}
        {series.map((item) => {
          const chartPoints = item.values.map((value, index) => ({
            x: years.length === 1 ? 390 : 88 + index * 300,
            y: 254 - (value / max) * 190,
          }));
          const points = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
          return (
            <g key={item.group}>
              <polyline
                className="trend-line"
                fill="none"
                pathLength="1"
                points={points}
                stroke={colors[item.group] ?? '#64748b'}
                strokeLinecap="round"
                strokeWidth="5"
              />
              {chartPoints.map((point) => (
                <circle
                  className="trend-point"
                  cx={point.x}
                  cy={point.y}
                  fill={colors[item.group] ?? '#64748b'}
                  key={`${item.group}-${point.x}`}
                  r="6"
                />
              ))}
            </g>
          );
        })}
        {years.map((year, index) => (
          <text className="axis-text" key={year} x={years.length === 1 ? 390 : 88 + index * 300} y="284">
            {year}
          </text>
        ))}
      </svg>
      <Legend colors={colors} labels={groups} />
    </div>
  );
}

function StackedBars({ colors, data, groupKey, yearKey }) {
  const years = [...new Set(data.map((row) => String(row[yearKey])))].sort();
  const groups = [...new Set(data.map((row) => row[groupKey]).filter(Boolean))];
  const max = Math.max(
    ...years.map((year) => data.filter((row) => String(row[yearKey]) === year).length),
    1,
  );
  const yTicks = [max, Math.round(max * 0.67), Math.round(max * 0.33), 0];

  return (
    <div className="stacked-chart">
      <div className="stacked-plot">
        <div className="stack-y-axis" aria-hidden="true">
          {yTicks.map((tick, index) => (
            <span key={`${tick}-${index}`}>{tick}</span>
          ))}
        </div>

        <div className="stacked-bars-area">
          {years.map((year) => {
            const rows = data.filter((row) => String(row[yearKey]) === year);
            return (
              <div className="stack-column" key={year}>
                <strong>{rows.length}</strong>
                <div className="stack-track" style={{ height: `${Math.max((rows.length / max) * 100, 8)}%` }}>
                  {groups.map((group) => {
                    const count = rows.filter((row) => row[groupKey] === group).length;
                    return count ? (
                      <i
                        key={group}
                        className="stack-segment"
                        style={{
                          background: colors[group],
                          height: `${(count / rows.length) * 100}%`,
                        }}
                      />
                    ) : null;
                  })}
                </div>
                <span>{year}</span>
              </div>
            );
          })}
        </div>
      </div>
      <Legend colors={colors} labels={groups} />
    </div>
  );
}

function DonutChart({ centerLabel, colors = {}, data, subLabel, variant = 'default' }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const fallbackColors = ['#071126', '#d8e0ea', '#10b981', '#f59e0b', '#8b5cf6'];
  const isSplitLarge = variant === 'splitLarge';
  const centerX = isSplitLarge ? 170 : 130;
  const centerY = isSplitLarge ? 146 : 100;
  const radius = isSplitLarge ? 92 : 70;
  const strokeWidth = isSplitLarge ? 56 : 44;
  const viewBox = isSplitLarge ? '0 0 340 292' : '0 0 260 220';
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const legend = (
    <div className="legend-list">
      {data.map((item, index) => (
        <p key={item.label}>
          <i style={{ background: colors[item.label] ?? fallbackColors[index % fallbackColors.length] }} />
          {cleanLabel(item.label)}
          <strong>{item.value}</strong>
        </p>
      ))}
    </div>
  );
  const chart = (
    <div className="donut-chart">
      <svg className="donut-svg" viewBox={viewBox} role="img" aria-label={`${subLabel} distribution donut chart`}>
        <circle className="donut-slice-bg" cx={centerX} cy={centerY} fill="none" r={radius} strokeWidth={strokeWidth} />
        {data.map((item, index) => {
          const percent = item.value / total;
          const dash = percent * circumference;
          const currentOffset = offset;
          const midAngle = -90 + (currentOffset + dash / 2) / circumference * 360;
          const sliceColor = colors[item.label] ?? fallbackColors[index % fallbackColors.length];
          const textPoint = polarPoint(centerX, centerY, radius, midAngle);

          offset += dash;

          return (
            <g key={item.label}>
              <circle
                className="donut-slice"
                cx={centerX}
                cy={centerY}
                fill="none"
                r={radius}
                stroke={sliceColor}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                strokeWidth={strokeWidth}
                style={{
                  '--slice-final-offset': -currentOffset,
                  '--slice-start-offset': circumference - currentOffset,
                }}
                transform={`rotate(-90 ${centerX} ${centerY})`}
              />
              <text
                className="donut-percent"
                fill={contrastTextColor(sliceColor)}
                textAnchor="middle"
                x={textPoint.x}
                y={textPoint.y + 4}
              >
                {Math.round(percent * 100)}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="donut-center">
        <strong>{centerLabel}</strong>
        <span>{subLabel}</span>
      </div>
    </div>
  );

  return (
    <div className={`donut-layout ${isSplitLarge ? 'split-large' : ''}`}>
      {isSplitLarge ? (
        <>
          {legend}
          {chart}
        </>
      ) : (
        <>
          {chart}
          {legend}
        </>
      )}
    </div>
  );
}

function polarPoint(centerX, centerY, radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function contrastTextColor(color) {
  const hex = color.replace('#', '');
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 145 ? '#0f172a' : '#ffffff';
}

function Gauge({ value }) {
  return (
    <div className="gauge-wrap">
      <div className="gauge" style={{ '--value': `${value}%`, '--gauge-angle': `${value * 3.6}deg` }}>
        <strong>{value}%</strong>
        <span>aligned</span>
      </div>
      <div className="legend-list">
        <p>
          <i style={{ background: '#071126' }} />
          Degree-Aligned Position
        </p>
        <p>
          <i style={{ background: '#d8e0ea' }} />
          Degree-Mismatched Position
        </p>
      </div>
    </div>
  );
}

function RankedBars({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="ranked-bars">
      {data.map((item) => (
        <div className="rank-row" key={item.label}>
          <span>{cleanLabel(item.label)}</span>
          <div>
            <i style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function FlowDiagram({ colors = {}, columns, data, limitPerColumn }) {
  const width = Math.max(1320, columns.length * 360);
  const height = columns.length > 3 ? 720 : 620;
  const leftPadding = 210;
  const rightPadding = 240;
  const topPadding = 82;
  const bottomPadding = 54;
  const columnX = columns.map(
    (_, index) =>
      leftPadding + index * ((width - leftPadding - rightPadding) / (columns.length - 1 || 1)),
  );
  const visibleNodes = columns.map((column, index) =>
    countBy(data, column.key)
      .slice(0, limitPerColumn[index])
      .map((item) => item.label),
  );
  const nodeLookup = new Map();
  const nodeColumns = visibleNodes.map((labels, columnIndex) => {
    const usableHeight = height - topPadding - bottomPadding;
    const gap = usableHeight / (labels.length + 1);
    return labels.map((label, index) => {
      const node = {
        key: `${columnIndex}:${label}`,
        label,
        x: columnX[columnIndex],
        y: topPadding + gap * (index + 1),
      };
      nodeLookup.set(node.key, node);
      return node;
    });
  });
  const links = [];

  columns.slice(0, -1).forEach((column, columnIndex) => {
    const nextColumn = columns[columnIndex + 1];
    const pairCounts = new Map();

    data.forEach((row) => {
      const source = row[column.key];
      const target = row[nextColumn.key];
      if (!visibleNodes[columnIndex].includes(source) || !visibleNodes[columnIndex + 1].includes(target)) {
        return;
      }

      const key = `${source}~~~${target}`;
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    });

    pairCounts.forEach((value, key) => {
      const [source, target] = key.split('~~~');
      const sourceNode = nodeLookup.get(`${columnIndex}:${source}`);
      const targetNode = nodeLookup.get(`${columnIndex + 1}:${target}`);

      if (sourceNode && targetNode) {
        links.push({ source: sourceNode, target: targetNode, value });
      }
    });
  });

  return (
    <div className="flow-scroll">
      <svg className="flow-diagram" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Node link diagram">
        {columns.map((column, index) => (
          <text className="flow-title" key={column.key} textAnchor="middle" x={columnX[index]} y="26">
            {column.title}
          </text>
        ))}
        {links.map((link) => {
          const color = colors[link.source.label] ?? '#9aa3af';
          return (
            <path
              className="flow-link"
              d={curvePath(link.source.x, link.source.y, link.target.x, link.target.y)}
              fill="none"
              key={`${link.source.key}-${link.target.key}`}
              opacity="0.42"
              pathLength="1"
              stroke={color}
              strokeLinecap="round"
              strokeWidth={Math.max(1, Math.min(8, Math.sqrt(link.value) * 1.15))}
            />
          );
        })}
        {nodeColumns.flat().map((node) => (
          <g key={node.key}>
            <circle cx={node.x} cy={node.y} fill={colors[node.label] ?? '#64748b'} r="8" />
            <text
              className="node-label"
              textAnchor={node.x < width / 2 ? 'end' : 'start'}
              x={node.x + (node.x < width / 2 ? -14 : 14)}
              y={node.y + 5}
            >
              {cleanLabel(node.label)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Legend({ colors, labels }) {
  return (
    <div className="inline-legend">
      {labels.map((label) => (
        <span key={label}>
          <i style={{ background: colors[label] }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function countBy(data, key) {
  const counts = new Map();
  data.forEach((row) => {
    const value = row[key];
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  });

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || String(a.label).localeCompare(String(b.label)));
}

function percentOf(data, key, target) {
  if (!data.length) {
    return 0;
  }

  return Math.round((data.filter((row) => row[key] === target).length / data.length) * 100);
}

function cleanLabel(label) {
  return String(label)
    .replace(' field', '')
    .replace('Sciences, Engineering, and Technology', 'Sciences, Eng, & Tech')
    .replace('Education and Human Development', 'Education & Human Dev')
    .replace('Media and Marketing', 'Media & Marketing')
    .replace('Bachelor of Science', 'BS')
    .replace('Bachelor of Arts', 'AB');
}

function curvePath(x1, y1, x2, y2) {
  const mid = (x2 - x1) * 0.56;
  return `M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`;
}

function fieldColorMap(data, key, palette = fieldColors) {
  const labels = countBy(data, key).map((item) => item.label);
  return Object.fromEntries(labels.map((label, index) => [label, palette[index % palette.length]]));
}

function dominantColorMap(data, targetKey, sourceKey, sourceColors) {
  const targetSources = new Map();

  data.forEach((row) => {
    const target = row[targetKey];
    const source = row[sourceKey];

    if (!target || !source) {
      return;
    }

    if (!targetSources.has(target)) {
      targetSources.set(target, new Map());
    }

    const counts = targetSources.get(target);
    counts.set(source, (counts.get(source) ?? 0) + 1);
  });

  return Object.fromEntries(
    [...targetSources.entries()].map(([target, counts]) => {
      const dominantSource = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return [target, sourceColors[dominantSource] ?? '#64748b'];
    }),
  );
}

export default App;
