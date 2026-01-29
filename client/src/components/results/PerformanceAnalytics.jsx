/**
 * Performance Charts Component
 * Displays student performance analytics with beautiful visualizations
 */

import { useState } from 'react'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { TrendingUp, BarChart3, Target, PieChartIcon } from 'lucide-react'

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100">
                <p className="font-medium text-gray-800">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: <span className="font-bold">{entry.value}%</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// Progress Line Chart - Score progression over time
export const ProgressChart = ({ data = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                <p>No data available for chart</p>
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-[var(--primary)]" size={20} />
                <h3 className="font-semibold">Score Progression</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="testName"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="percentage"
                        name="Score"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        fill="url(#colorScore)"
                    />
                    <Line
                        type="monotone"
                        dataKey="classAverage"
                        name="Class Avg"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

// Subject Comparison Bar Chart
export const SubjectComparisonChart = ({ data = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                <p>No subject data available</p>
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-[var(--secondary)]" size={20} />
                <h3 className="font-semibold">Subject-wise Performance</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="yourScore"
                        name="Your Score"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="classAverage"
                        name="Class Average"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// Strengths/Weaknesses Radar Chart
export const StrengthsRadarChart = ({ data = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                <p>No data available for radar chart</p>
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
                <Target className="text-emerald-500" size={20} />
                <h3 className="font-semibold">Strengths & Weaknesses</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                    />
                    <Radar
                        name="Your Score"
                        dataKey="score"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.4}
                        strokeWidth={2}
                    />
                    <Radar
                        name="Class Average"
                        dataKey="classAverage"
                        stroke="#94a3b8"
                        fill="#94a3b8"
                        fillOpacity={0.2}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                    />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}

// Grade Distribution Pie Chart
export const GradeDistributionChart = ({ data = {} }) => {
    const COLORS = ['#10b981', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626', '#991b1b']
    const grades = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F']

    const pieData = grades.map((grade, i) => ({
        name: grade,
        value: data[grade] || 0,
        color: COLORS[i]
    })).filter(item => item.value > 0)

    if (pieData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                <p>No grade distribution data</p>
            </div>
        )
    }

    return (
        <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="text-purple-500" size={20} />
                <h3 className="font-semibold">Grade Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
                {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}: {item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Main Analytics Dashboard Component
const PerformanceAnalytics = ({ resultsHistory = [], currentResult = null }) => {
    const [activeTab, setActiveTab] = useState('progress')

    // Process data for charts
    const progressData = resultsHistory.map(r => ({
        testName: r.test?.testName || 'Test',
        percentage: r.data?.percentage || 0,
        classAverage: r.classAverage || 70 // Placeholder if not available
    }))

    // Subject data from current result
    const subjectData = currentResult?.subjectMarks
        ? Object.entries(currentResult.subjectMarks).map(([subject, marks]) => {
            const maxMarks = currentResult.test?.subjects?.find(s => s.name === subject)?.maxMarks || 100
            return {
                subject: subject.replace('_', ' '),
                yourScore: Math.round((marks / maxMarks) * 100),
                classAverage: 70 // Placeholder
            }
        })
        : []

    // Radar data (same as subject but different format)
    const radarData = subjectData.map(s => ({
        subject: s.subject,
        score: s.yourScore,
        classAverage: s.classAverage
    }))

    const tabs = [
        { id: 'progress', label: 'Progress', icon: TrendingUp },
        { id: 'subjects', label: 'Subjects', icon: BarChart3 },
        { id: 'strengths', label: 'Strengths', icon: Target }
    ]

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`btn gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'btn-primary'
                                : 'btn-outline'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Chart Content */}
            <div className="animate-fadeIn">
                {activeTab === 'progress' && <ProgressChart data={progressData} />}
                {activeTab === 'subjects' && <SubjectComparisonChart data={subjectData} />}
                {activeTab === 'strengths' && <StrengthsRadarChart data={radarData} />}
            </div>
        </div>
    )
}

export default PerformanceAnalytics
