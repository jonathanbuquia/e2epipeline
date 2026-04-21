import { useEffect, useState } from 'react';
import { workbookGroups } from './data/workbooks.js';

const menuItems = [
  { id: 'overview', label: 'Career Snapshot' },
  { id: 'enrollment', label: 'SHS to Degree' },
  { id: 'employment', label: 'Graduate Jobs' },
  { id: 'trajectory', label: 'Career Flow' },
  { id: 'sources', label: 'JSON Sources' },
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
  const [selectedYear, setSelectedYear] = useState('All');
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
  const selectedYearRows =
    selectedYear === 'All' || Number(selectedYear) <= 2021
      ? filteredEnrollment
      : filteredCareerRecords.map((row) => ({
          ...row,
          shs_strand: row.enrollment?.shs_strand ?? 'Unmapped',
        }));
  const selectedYearUnit =
    selectedYear === 'All' || Number(selectedYear) <= 2021 ? 'students' : 'graduates';
  const selectedYearLabel = yearContext.label ?? selectedYear;
  const alignedCount = filteredCareerRecords.filter(
    (row) => row.match_or_mismatch === 'Match',
  ).length;
  const alignmentRate = filteredCareerRecords.length
    ? Math.round((alignedCount / filteredCareerRecords.length) * 100)
    : 0;
  const totalWorkbooks = workbookGroups.reduce(
    (total, group) => total + group.files.length,
    0,
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">CT</span>
          <div>
            <p>Career Trajectory</p>
            <strong>Dashboard</strong>
          </div>
        </div>

        <nav className="menu-list" aria-label="Dashboard sections">
          {menuItems.map((item, index) => (
            <button
              className={activeView === item.id ? 'active' : ''}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <p>Live JSON data</p>
          <strong>{totalWorkbooks} converted workbooks</strong>
        </div>
      </aside>

      <section className="content-panel">
        <header className="content-header">
          <div>
            <p className="eyebrow">Static snapshot export</p>
            <h1>Career Trajectory Dashboard</h1>
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
            <select
              aria-label="Select year"
              onChange={(event) => setSelectedYear(event.target.value)}
              value={selectedYear}
            >
              <option value="All">All</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </header>

        {isLoading ? (
          <section className="empty-state">Loading JSON dashboard data...</section>
        ) : (
          <>
            {activeView === 'overview' && (
              <OverviewView
                alignmentRate={alignmentRate}
                enrollment={filteredEnrollment}
                employment={filteredEmployment}
                graduationYear={yearContext.graduationYear}
                selectedStrand={selectedStrand}
                selectedYear={selectedYear}
                selectedYearLabel={selectedYearLabel}
                selectedYearRows={selectedYearRows}
                selectedYearUnit={selectedYearUnit}
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

            {activeView === 'sources' && <SourcesView />}
          </>
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
  selectedStrand,
  selectedYear,
  selectedYearLabel,
  selectedYearRows,
  selectedYearUnit,
}) {
  const totalEnrollment = enrollment.length;
  const totalGraduates = employment.length;

  return (
    <>
      <section className="kpi-grid" aria-label="Key metrics">
        <MetricCard detail={`${selectedYearLabel} selected filter`} label="Enrollment records" value={totalEnrollment} />
        <MetricCard detail={`${graduationYear ?? 'All Years'} paired outcomes`} label="Graduate records" value={totalGraduates} />
        <MetricCard detail={`${selectedStrand} career fit`} label="Job alignment" value={`${alignmentRate}%`} />
        <MetricCard detail="Filtered JSON records" label="Source workbooks" value="6" />
      </section>

      <section className="dashboard-grid">
        <ChartCard className="wide" eyebrow="Enrollment" title={`${selectedYearLabel} SHS enrollment profile`}>
          <MultiLineTrendChart
            colors={strandColors}
            data={enrollment}
            groupKey="shs_strand"
            yearKey="entering_year"
          />
        </ChartCard>

        <ChartCard eyebrow="Year mix" title={`${selectedYearLabel} strand distribution ratio`}>
          <DonutChart
            colors={strandColors}
            data={countBy(selectedYearRows, 'shs_strand')}
            centerLabel={`${selectedYearRows.length}`}
            subLabel={selectedYearUnit}
          />
        </ChartCard>

        <ChartCard className="full" eyebrow="Pathway" title={`${selectedYearLabel} node-link diagram: SHS strands to specific programs`}>
          <FlowDiagram
            colors={strandColors}
            columns={[
              { key: 'shs_strand', title: 'SHS Strand' },
              { key: 'undergraduate_field', title: 'Undergraduate Field' },
              { key: 'undergraduate_program', title: 'Specific Program' },
            ]}
            data={enrollment}
            limitPerColumn={[4, 5, 14]}
          />
        </ChartCard>
      </section>
    </>
  );
}

function EnrollmentView({ enrollment, selectedStrand, year }) {
  return (
    <section className="dashboard-grid">
      <ChartCard className="wide" eyebrow="Trend" title={`${year} ${selectedStrand} enrollment by cohort`}>
        <StackedBars
          colors={strandColors}
          data={enrollment}
          groupKey="shs_strand"
          yearKey="entering_year"
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

  return (
    <section className="dashboard-grid">
      <ChartCard className="full tall" eyebrow="Career path" title={`${graduationYear} ${selectedStrand} career trajectory flow`}>
        <FlowDiagram
          colors={strandColors}
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

function MultiLineTrendChart({ colors, data, groupKey, yearKey }) {
  const years = [...new Set(data.map((row) => String(row[yearKey])))].sort();
  const groups = [...new Set(data.map((row) => row[groupKey]).filter(Boolean))];
  const series = groups.map((group) => ({
    group,
    values: years.map((year) => data.filter((row) => String(row[yearKey]) === year && row[groupKey] === group).length),
  }));
  const max = Math.max(...series.flatMap((item) => item.values), 1);

  return (
    <div className="trend-chart">
      <svg viewBox="0 0 760 300" role="img" aria-label="SHS enrollment trend chart">
        {[0, 1, 2, 3].map((line) => (
          <line className="grid-line" key={line} x1="58" x2="728" y1={50 + line * 62} y2={50 + line * 62} />
        ))}
        {series.map((item) => {
          const chartPoints = item.values.map((value, index) => ({
            x: years.length === 1 ? 380 : 70 + index * 310,
            y: 254 - (value / max) * 190,
          }));
          const points = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
          return (
            <g key={item.group}>
              <polyline
                fill="none"
                points={points}
                stroke={colors[item.group] ?? '#64748b'}
                strokeLinecap="round"
                strokeWidth="5"
              />
              {chartPoints.map((point) => (
                <circle
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
          <text className="axis-text" key={year} x={years.length === 1 ? 380 : 70 + index * 310} y="284">
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

  return (
    <div className="stacked-chart">
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
      <Legend colors={colors} labels={groups} />
    </div>
  );
}

function DonutChart({ centerLabel, colors = {}, data, subLabel }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const fallbackColors = ['#071126', '#d8e0ea', '#10b981', '#f59e0b', '#8b5cf6'];
  const gradient = data
    .map((item, index) => {
      const start = cursor;
      cursor += (item.value / total) * 100;
      return `${colors[item.label] ?? fallbackColors[index % fallbackColors.length]} ${start}% ${cursor}%`;
    })
    .join(', ');

  return (
    <div className="donut-layout">
      <div className="donut-chart" style={{ background: `conic-gradient(${gradient})` }}>
        <strong>{centerLabel}</strong>
        <span>{subLabel}</span>
      </div>
      <div className="legend-list">
        {data.map((item, index) => (
          <p key={item.label}>
            <i style={{ background: colors[item.label] ?? fallbackColors[index % fallbackColors.length] }} />
            {item.label}
            <strong>{item.value}</strong>
          </p>
        ))}
      </div>
    </div>
  );
}

function Gauge({ value }) {
  return (
    <div className="gauge-wrap">
      <div className="gauge" style={{ '--value': `${value}%` }}>
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
              d={curvePath(link.source.x, link.source.y, link.target.x, link.target.y)}
              fill="none"
              key={`${link.source.key}-${link.target.key}`}
              opacity="0.42"
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

function fieldColorMap(data, key) {
  const labels = countBy(data, key).map((item) => item.label);
  return Object.fromEntries(labels.map((label, index) => [label, fieldColors[index % fieldColors.length]]));
}

export default App;
