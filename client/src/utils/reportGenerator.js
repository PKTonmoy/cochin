/**
 * Student Progress Report PDF Generator
 * Generates beautiful, detailed PDF reports using jsPDF + jspdf-autotable
 * 
 * Three report types:
 * 1. Attendance Report
 * 2. Results Report  
 * 3. Overall Progress Report
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================================
// COLOR PALETTE & CONSTANTS
// ============================================================
const COLORS = {
    primary: [26, 54, 93],        // Deep navy
    primaryLight: [59, 130, 246], // Blue
    secondary: [139, 92, 246],    // Purple
    accent: [16, 185, 129],       // Green
    success: [34, 197, 94],
    warning: [245, 158, 11],
    danger: [239, 68, 68],
    dark: [31, 41, 55],
    medium: [107, 114, 128],
    light: [156, 163, 175],
    veryLight: [243, 244, 246],
    white: [255, 255, 255],
    tableHeader: [30, 58, 95],
    tableStripe: [248, 250, 252],
    presentBg: [220, 252, 231],
    presentText: [22, 101, 52],
    absentBg: [254, 226, 226],
    absentText: [153, 27, 27],
    lateBg: [254, 249, 195],
    lateText: [133, 77, 14],
}

const MARGIN = 15
const PAGE_WIDTH = 210  // A4
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2)

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Load image as base64 data URL for embedding in PDF
 */
async function loadImageAsBase64(url) {
    if (!url) return null
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(blob)
        })
    } catch {
        return null
    }
}

/**
 * Format date nicely
 */
function formatDate(date) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    })
}

function formatShortDate(date) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

/**
 * Add page number footer
 */
function addFooter(doc, pageNum, totalPages, instituteName) {
    const pageHeight = doc.internal.pageSize.height
    doc.setDrawColor(...COLORS.light)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, pageHeight - 12, PAGE_WIDTH - MARGIN, pageHeight - 12)
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.medium)
    doc.text(instituteName, MARGIN, pageHeight - 8)
    doc.text(`Page ${pageNum}/${totalPages}`, PAGE_WIDTH / 2, pageHeight - 8, { align: 'center' })
    doc.text(formatShortDate(new Date()), PAGE_WIDTH - MARGIN, pageHeight - 8, { align: 'right' })
}

/**
 * Draw compact branded header (slim banner)
 */
async function drawHeader(doc, settings, reportTitle) {
    const instituteName = settings?.siteInfo?.name || 'PARAGON Coaching Center'
    const logoUrl = settings?.siteInfo?.logo?.url || ''
    const phones = settings?.contact?.phones || []

    // Slim header band
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, 0, PAGE_WIDTH, 18, 'F')

    // Logo (small)
    let textX = MARGIN
    const logoImg = await loadImageAsBase64(logoUrl)
    if (logoImg) {
        try {
            doc.addImage(logoImg, 'PNG', MARGIN, 2, 14, 14)
            textX = MARGIN + 17
        } catch { /* skip */ }
    }

    // Institute name
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(instituteName, textX, 8)

    // Phone under name
    if (phones[0]) {
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(phones[0], textX, 14)
    }

    // Report title on right
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(200, 215, 240)
    doc.text(reportTitle, PAGE_WIDTH - MARGIN, 11, { align: 'right' })

    return 22 // compact Y offset
}

/**
 * Draw compact student info strip (single line)
 */
function drawStudentInfoCard(doc, student, startY) {
    // Thin info strip
    doc.setFillColor(...COLORS.veryLight)
    doc.setDrawColor(...COLORS.light)
    doc.setLineWidth(0.3)
    doc.roundedRect(MARGIN, startY, CONTENT_WIDTH, 10, 2, 2, 'FD')

    doc.setFontSize(8)
    const infoY = startY + 7

    // Name (bold)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(student.name || 'N/A', MARGIN + 4, infoY)

    // Roll
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.medium)
    const nameW = doc.getTextWidth(student.name || 'N/A') + 8
    doc.text(`Roll: ${student.roll || 'N/A'}`, MARGIN + 4 + nameW, infoY)

    // Class
    const classStr = `Class: ${student.class || 'N/A'}${student.section ? ` (${student.section})` : ''}`
    doc.text(classStr, MARGIN + CONTENT_WIDTH / 2, infoY)

    // Phone
    doc.text(`Ph: ${student.phone || 'N/A'}`, PAGE_WIDTH - MARGIN - 4, infoY, { align: 'right' })

    return startY + 14
}

/**
 * Draw a stat card (mini)
 */
function drawStatCard(doc, x, y, width, height, label, value, color, subtext) {
    doc.setFillColor(...COLORS.white)
    doc.setDrawColor(...COLORS.veryLight)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, width, height, 2, 2, 'FD')

    // Color accent bar
    doc.setFillColor(...color)
    doc.roundedRect(x, y, 3, height, 1, 0, 'F')
    doc.rect(x + 1, y, 2, height, 'F')

    // Value
    doc.setTextColor(...color)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), x + 8, y + (subtext ? 10 : 12))

    // Label
    doc.setTextColor(...COLORS.medium)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text(label, x + 8, y + (subtext ? 16 : 18))

    // Subtext
    if (subtext) {
        doc.setTextColor(...COLORS.light)
        doc.setFontSize(5)
        doc.text(subtext, x + 8, y + 21)
    }
}

/**
 * Draw section title
 */
function drawSectionTitle(doc, title, y, icon) {
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 7, 1.5, 1.5, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${icon ? icon + '  ' : ''}${title}`, MARGIN + 4, y + 5)
    return y + 9
}

/**
 * Check if we need a new page
 */
function checkPageBreak(doc, currentY, neededHeight = 40) {
    const pageHeight = doc.internal.pageSize.height
    if (currentY + neededHeight > pageHeight - 25) {
        doc.addPage()
        return 20
    }
    return currentY
}


// ============================================================
// CALENDAR DRAWING HELPERS
// ============================================================

/**
 * Draw a single month calendar grid in the PDF
 * Returns the new Y position after drawing
 */
function drawCalendarMonth(doc, year, month, attendanceMap, startY) {
    const CELL_W = CONTENT_WIDTH / 7
    const CELL_H = 14
    const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDayOfWeek = firstDay.getDay() // 0=Sun
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalRows = Math.ceil((startDayOfWeek + daysInMonth) / 7)
    const calendarHeight = 10 + 8 + (totalRows * CELL_H) + 4 // title + headers + cells + padding

    let y = checkPageBreak(doc, startY, calendarHeight)

    // Month title
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 9, 1.5, 1.5, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${MONTH_NAMES[month]} ${year}`, MARGIN + 4, y + 6.5)

    // Month stats on the right side of the title
    let mPresent = 0, mAbsent = 0, mLate = 0
    for (let d = 1; d <= daysInMonth; d++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const status = attendanceMap[key]
        if (status === 'present') mPresent++
        else if (status === 'absent') mAbsent++
        else if (status === 'late') mLate++
    }
    const mTotal = mPresent + mAbsent + mLate
    const mRate = mTotal > 0 ? Math.round((mPresent / mTotal) * 100) : 0
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`P:${mPresent}  A:${mAbsent}  L:${mLate}  Rate:${mRate}%`, PAGE_WIDTH - MARGIN - 4, y + 6.5, { align: 'right' })
    y += 11

    // Day-of-week headers
    doc.setFillColor(...COLORS.veryLight)
    doc.rect(MARGIN, y, CONTENT_WIDTH, 7, 'F')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.medium)
    DAY_HEADERS.forEach((day, i) => {
        doc.text(day, MARGIN + (i * CELL_W) + CELL_W / 2, y + 5, { align: 'center' })
    })
    y += 8

    // Draw day cells
    let dayNum = 1
    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < 7; col++) {
            const cellX = MARGIN + col * CELL_W
            const cellY = y + row * CELL_H

            // Draw cell border
            doc.setDrawColor(...COLORS.veryLight)
            doc.setLineWidth(0.2)
            doc.rect(cellX, cellY, CELL_W, CELL_H, 'S')

            if ((row === 0 && col < startDayOfWeek) || dayNum > daysInMonth) {
                // Empty cell (before month starts or after month ends)
                doc.setFillColor(250, 250, 250)
                doc.rect(cellX + 0.3, cellY + 0.3, CELL_W - 0.6, CELL_H - 0.6, 'F')
                continue
            }

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const cellDate = new Date(year, month, dayNum)
            cellDate.setHours(0, 0, 0, 0)
            const isFuture = cellDate > today
            const status = attendanceMap[dateKey]

            // Cell background based on status
            if (status === 'present') {
                doc.setFillColor(...COLORS.presentBg)
            } else if (status === 'absent') {
                doc.setFillColor(...COLORS.absentBg)
            } else if (status === 'late') {
                doc.setFillColor(...COLORS.lateBg)
            } else if (isFuture) {
                doc.setFillColor(248, 249, 250)
            } else {
                doc.setFillColor(255, 255, 255)
            }
            doc.rect(cellX + 0.3, cellY + 0.3, CELL_W - 0.6, CELL_H - 0.6, 'F')

            // Day number
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            if (status === 'present') {
                doc.setTextColor(...COLORS.presentText)
            } else if (status === 'absent') {
                doc.setTextColor(...COLORS.absentText)
            } else if (status === 'late') {
                doc.setTextColor(...COLORS.lateText)
            } else if (isFuture) {
                doc.setTextColor(200, 200, 200)
            } else {
                doc.setTextColor(...COLORS.light)
            }
            doc.text(String(dayNum), cellX + 3, cellY + 5.5)

            // Status indicator symbol
            if (status) {
                doc.setFontSize(8)
                doc.setFont('helvetica', 'bold')
                let symbol = ''
                if (status === 'present') { symbol = '✓'; doc.setTextColor(...COLORS.presentText) }
                else if (status === 'absent') { symbol = '✗'; doc.setTextColor(...COLORS.absentText) }
                else if (status === 'late') { symbol = '~'; doc.setTextColor(...COLORS.lateText) }
                doc.text(symbol, cellX + CELL_W / 2, cellY + CELL_H - 3, { align: 'center' })
            }

            dayNum++
        }
    }

    return y + totalRows * CELL_H + 6
}

/**
 * Draw color legend for the calendar
 */
function drawCalendarLegend(doc, y) {
    y = checkPageBreak(doc, y, 12)
    const legendItems = [
        { label: 'Present', bg: COLORS.presentBg, text: COLORS.presentText },
        { label: 'Absent', bg: COLORS.absentBg, text: COLORS.absentText },
        { label: 'Late', bg: COLORS.lateBg, text: COLORS.lateText },
        { label: 'No Record', bg: [255, 255, 255], text: COLORS.light },
    ]

    const totalWidth = legendItems.length * 40
    const startX = MARGIN + (CONTENT_WIDTH - totalWidth) / 2

    legendItems.forEach((item, i) => {
        const x = startX + i * 42
        // Color swatch
        doc.setFillColor(...item.bg)
        doc.setDrawColor(...COLORS.veryLight)
        doc.setLineWidth(0.2)
        doc.roundedRect(x, y, 8, 5, 1, 1, 'FD')
        // Label
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...item.text)
        doc.text(item.label, x + 10, y + 3.8)
    })

    return y + 10
}

// ============================================================
// REPORT 1: ATTENDANCE REPORT
// ============================================================
export async function generateAttendanceReport(student, attendanceData, settings) {
    const doc = new jsPDF('p', 'mm', 'a4')
    const instituteName = settings?.siteInfo?.name || 'PARAGON Coaching Center'

    // Header
    let y = await drawHeader(doc, settings, 'ATTENDANCE REPORT')

    // Student Info
    y = drawStudentInfoCard(doc, student, y)

    // Summary stats
    const attendance = attendanceData?.attendance || []
    const summary = attendanceData?.summary || {}

    const totalClasses = summary.totalClasses || 0
    const presentClasses = summary.presentClasses || 0
    const absentClasses = totalClasses - presentClasses
    const totalTests = summary.totalTests || 0
    const presentTests = summary.presentTests || 0
    const classRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0
    const testRate = totalTests > 0 ? Math.round((presentTests / totalTests) * 100) : 0
    const overallTotal = totalClasses + totalTests
    const overallPresent = presentClasses + presentTests
    const overallRate = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0

    // Draw summary cards
    const cardW = (CONTENT_WIDTH - 9) / 4
    const cardH = 22
    drawStatCard(doc, MARGIN, y, cardW, cardH, 'Total', overallTotal, COLORS.primaryLight, `${totalClasses} cls, ${totalTests} tst`)
    drawStatCard(doc, MARGIN + cardW + 3, y, cardW, cardH, 'Present', overallPresent, COLORS.success)
    drawStatCard(doc, MARGIN + (cardW + 3) * 2, y, cardW, cardH, 'Absent', overallTotal - overallPresent, COLORS.danger)
    drawStatCard(doc, MARGIN + (cardW + 3) * 3, y, cardW, cardH, 'Rate', `${overallRate}%`, overallRate >= 75 ? COLORS.success : COLORS.danger)

    y += cardH + 6

    // Attendance percentage bar
    y = drawSectionTitle(doc, 'Attendance Breakdown', y)
    y += 2

    // Class attendance bar
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(`Class Attendance: ${classRate}%`, MARGIN, y + 4)
    doc.setFillColor(...COLORS.veryLight)
    doc.roundedRect(MARGIN + 50, y, CONTENT_WIDTH - 50, 6, 2, 2, 'F')
    if (classRate > 0) {
        doc.setFillColor(...(classRate >= 75 ? COLORS.success : COLORS.danger))
        doc.roundedRect(MARGIN + 50, y, (CONTENT_WIDTH - 50) * (classRate / 100), 6, 2, 2, 'F')
    }
    y += 12

    // Test attendance bar
    doc.text(`Test Attendance: ${testRate}%`, MARGIN, y + 4)
    doc.setFillColor(...COLORS.veryLight)
    doc.roundedRect(MARGIN + 50, y, CONTENT_WIDTH - 50, 6, 2, 2, 'F')
    if (testRate > 0) {
        doc.setFillColor(...(testRate >= 75 ? COLORS.success : COLORS.danger))
        doc.roundedRect(MARGIN + 50, y, (CONTENT_WIDTH - 50) * (testRate / 100), 6, 2, 2, 'F')
    }
    y += 16

    // Monthly breakdown table
    const monthlyData = {}
    attendance.forEach(a => {
        const month = new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        if (!monthlyData[month]) {
            monthlyData[month] = { total: 0, present: 0, absent: 0, late: 0 }
        }
        monthlyData[month].total++
        if (a.status === 'present') monthlyData[month].present++
        else if (a.status === 'absent') monthlyData[month].absent++
        else if (a.status === 'late') monthlyData[month].late++
    })

    if (Object.keys(monthlyData).length > 0) {
        y = checkPageBreak(doc, y, 40)
        y = drawSectionTitle(doc, 'Monthly Summary', y)

        autoTable(doc, {
            startY: y,
            head: [['Month', 'Total', 'Present', 'Absent', 'Late', 'Rate']],
            body: Object.entries(monthlyData).map(([month, data]) => [
                month,
                data.total,
                data.present,
                data.absent,
                data.late,
                `${data.total > 0 ? Math.round((data.present / data.total) * 100) : 0}%`
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.tableHeader,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 8,
                halign: 'center',
                cellPadding: 3,
            },
            alternateRowStyles: {
                fillColor: COLORS.tableStripe,
            },
            margin: { left: MARGIN, right: MARGIN },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold' },
                5: { fontStyle: 'bold' },
            },
        })
        y = doc.lastAutoTable.finalY + 10
    }

    // ── Calendar-Style Attendance View ──
    if (attendance.length > 0) {
        // Build a date→status map (use worst status if multiple records on same day)
        const attendanceMap = {}
        attendance.forEach(a => {
            const d = new Date(a.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const existing = attendanceMap[key]
            // Priority: absent > late > present
            if (!existing) {
                attendanceMap[key] = a.status
            } else if (a.status === 'absent') {
                attendanceMap[key] = 'absent'
            } else if (a.status === 'late' && existing !== 'absent') {
                attendanceMap[key] = 'late'
            }
        })

        // Determine month range from attendance data
        const dates = attendance.map(a => new Date(a.date))
        const minDate = new Date(Math.min(...dates))
        const maxDate = new Date(Math.max(...dates))

        // Generate calendar for each month (most recent first)
        const months = []
        let cur = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
        const endMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
        while (cur >= endMonth) {
            months.push({ year: cur.getFullYear(), month: cur.getMonth() })
            cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1)
        }

        y = checkPageBreak(doc, y, 30)
        y = drawSectionTitle(doc, 'Calendar Attendance View', y)
        y += 2

        // Draw legend first
        y = drawCalendarLegend(doc, y)

        // Draw each month's calendar
        for (const m of months) {
            y = drawCalendarMonth(doc, m.year, m.month, attendanceMap, y)
        }
    }

    // Add footers
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, i, totalPages, instituteName)
    }

    doc.save(`Attendance_Report_${student.roll}_${student.name?.replace(/\s+/g, '_')}.pdf`)
}


// ============================================================
// REPORT 2: RESULTS REPORT
// ============================================================
export async function generateResultsReport(student, resultsData, settings) {
    const doc = new jsPDF('p', 'mm', 'a4')
    const instituteName = settings?.siteInfo?.name || 'PARAGON Coaching Center'

    // Header
    let y = await drawHeader(doc, settings, 'ACADEMIC RESULTS REPORT')

    // Student Info
    y = drawStudentInfoCard(doc, student, y)

    // Process results data
    const history = resultsData || []
    const resultsWithData = history.filter(h => h.type === 'result' && h.data)
    const noResults = history.filter(h => h.type === 'no_result')

    // Summary stats
    const totalTests = history.length
    const attempted = resultsWithData.length
    const percentages = resultsWithData.map(r => r.data.percentage || 0)
    const avgPercentage = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0
    const bestScore = percentages.length > 0 ? Math.max(...percentages) : 0
    const lowestScore = percentages.length > 0 ? Math.min(...percentages) : 0

    // Grade distribution
    const gradeCount = {}
    resultsWithData.forEach(r => {
        const grade = r.data.grade || 'N/A'
        gradeCount[grade] = (gradeCount[grade] || 0) + 1
    })

    // Stats cards
    const cardW = (CONTENT_WIDTH - 12) / 5
    const cardH = 20
    drawStatCard(doc, MARGIN, y, cardW, cardH, 'Tests', totalTests, COLORS.primaryLight)
    drawStatCard(doc, MARGIN + (cardW + 3), y, cardW, cardH, 'Taken', attempted, COLORS.secondary)
    drawStatCard(doc, MARGIN + (cardW + 3) * 2, y, cardW, cardH, 'Avg', `${avgPercentage}%`, avgPercentage >= 60 ? COLORS.success : COLORS.warning)
    drawStatCard(doc, MARGIN + (cardW + 3) * 3, y, cardW, cardH, 'Best', `${bestScore}%`, COLORS.success)
    drawStatCard(doc, MARGIN + (cardW + 3) * 4, y, cardW, cardH, 'Low', `${lowestScore}%`, COLORS.danger)

    y += cardH + 6

    // Grade Distribution Section
    if (Object.keys(gradeCount).length > 0) {
        y = drawSectionTitle(doc, 'Grade Distribution', y)
        y += 2

        const gradeOrder = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F']
        const gradeColors = {
            'A+': COLORS.success, 'A': [52, 211, 153], 'A-': [110, 231, 183],
            'B': COLORS.primaryLight, 'C': COLORS.warning, 'D': [251, 146, 60], 'F': COLORS.danger
        }

        let gx = MARGIN
        gradeOrder.forEach(grade => {
            if (gradeCount[grade]) {
                const gColor = gradeColors[grade] || COLORS.medium
                const pillW = 28
                doc.setFillColor(...gColor)
                doc.roundedRect(gx, y, pillW, 14, 3, 3, 'F')
                doc.setTextColor(...COLORS.white)
                doc.setFontSize(10)
                doc.setFont('helvetica', 'bold')
                doc.text(grade, gx + pillW / 2, y + 6, { align: 'center' })
                doc.setFontSize(7)
                doc.setFont('helvetica', 'normal')
                doc.text(`×${gradeCount[grade]}`, gx + pillW / 2, y + 11, { align: 'center' })
                gx += pillW + 4
            }
        })
        y += 22
    }

    // Results table
    if (resultsWithData.length > 0) {
        y = checkPageBreak(doc, y, 40)
        y = drawSectionTitle(doc, 'Test Results Summary', y)

        autoTable(doc, {
            startY: y,
            head: [['#', 'Test Name', 'Date', 'Marks', 'Max', '%', 'Grade', 'Rank']],
            body: resultsWithData.map((r, idx) => [
                idx + 1,
                r.test?.testName || 'N/A',
                formatShortDate(r.test?.date),
                r.data.totalMarks || 0,
                r.data.maxMarks || r.test?.totalMaxMarks || 0,
                `${r.data.percentage || 0}%`,
                r.data.grade || 'N/A',
                r.data.rank ? `#${r.data.rank}` : '-'
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.tableHeader,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                halign: 'center',
            },
            alternateRowStyles: {
                fillColor: COLORS.tableStripe,
            },
            margin: { left: MARGIN, right: MARGIN },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { halign: 'left', cellWidth: 50 },
                2: { cellWidth: 25 },
                6: { cellWidth: 15, fontStyle: 'bold' },
                7: { cellWidth: 15, fontStyle: 'bold' },
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 6) {
                    const grade = data.cell.raw
                    if (grade === 'A+' || grade === 'A') {
                        data.cell.styles.textColor = COLORS.presentText
                    } else if (grade === 'F') {
                        data.cell.styles.textColor = COLORS.absentText
                    }
                }
            },
        })
        y = doc.lastAutoTable.finalY + 10
    }

    // Detailed subject-wise breakdown for each test
    for (const result of resultsWithData) {
        const subjectMarks = result.data.subjectMarks
        if (!subjectMarks || (subjectMarks instanceof Map ? subjectMarks.size === 0 : Object.keys(subjectMarks).length === 0)) continue

        y = checkPageBreak(doc, y, 50)

        // Test title mini-header
        doc.setFillColor(...COLORS.secondary)
        doc.setGState(new doc.GState({ opacity: 0.1 }))
        doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 8, 2, 2, 'F')
        doc.setGState(new doc.GState({ opacity: 1 }))
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.secondary)
        doc.text(`${result.test?.testName || 'Test'} — Subject-wise Marks`, MARGIN + 4, y + 5.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.medium)
        doc.text(formatShortDate(result.test?.date), PAGE_WIDTH - MARGIN - 4, y + 5.5, { align: 'right' })
        y += 10

        // Convert Map-like object to array
        const entries = subjectMarks instanceof Map
            ? Array.from(subjectMarks.entries())
            : Object.entries(subjectMarks)

        // Try to find max marks per subject from test
        const testSubjects = result.test?.subjects || []

        autoTable(doc, {
            startY: y,
            head: [['Subject', 'Marks Obtained', 'Max Marks', 'Percentage']],
            body: entries.map(([subject, marks]) => {
                const testSub = testSubjects.find(s => s.name === subject)
                const max = testSub?.maxMarks || '-'
                const pct = max !== '-' && max > 0 ? `${Math.round((marks / max) * 100)}%` : '-'
                return [subject, marks, max, pct]
            }),
            foot: [[
                'Total',
                result.data.totalMarks || 0,
                result.data.maxMarks || result.test?.totalMaxMarks || 0,
                `${result.data.percentage || 0}%`
            ]],
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.secondary,
                textColor: COLORS.white,
                fontSize: 8,
                halign: 'center',
            },
            footStyles: {
                fillColor: COLORS.primary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2.5,
                halign: 'center',
            },
            alternateRowStyles: {
                fillColor: COLORS.tableStripe,
            },
            margin: { left: MARGIN + 10, right: MARGIN + 10 },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold' },
            },
        })
        y = doc.lastAutoTable.finalY + 8
    }

    // Missed tests
    if (noResults.length > 0) {
        y = checkPageBreak(doc, y, 30)
        y = drawSectionTitle(doc, 'Tests Without Results', y)

        autoTable(doc, {
            startY: y,
            head: [['#', 'Test Name', 'Date', 'Status']],
            body: noResults.map((r, idx) => [
                idx + 1,
                r.test?.testName || 'N/A',
                formatShortDate(r.test?.date),
                r.status === 'present' ? 'Present (No result)' : r.status === 'absent' ? 'Absent' : 'Unknown'
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: [180, 83, 9],
                textColor: COLORS.white,
                fontSize: 8,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2.5,
                halign: 'center',
            },
            alternateRowStyles: {
                fillColor: [255, 251, 235],
            },
            margin: { left: MARGIN, right: MARGIN },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { halign: 'left', cellWidth: 60 },
            },
        })
    }

    // Footers
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, i, totalPages, instituteName)
    }

    doc.save(`Results_Report_${student.roll}_${student.name?.replace(/\s+/g, '_')}.pdf`)
}


// ============================================================
// REPORT 3: OVERALL PROGRESS REPORT
// ============================================================
export async function generateOverallProgressReport(student, attendanceData, resultsData, paymentsData, settings) {
    const doc = new jsPDF('p', 'mm', 'a4')
    const instituteName = settings?.siteInfo?.name || 'PARAGON Coaching Center'

    // Header
    let y = await drawHeader(doc, settings, 'OVERALL PROGRESS REPORT')

    // Student Info strip
    y = drawStudentInfoCard(doc, student, y)

    // ==============================
    // ATTENDANCE SUMMARY
    // ==============================
    y = checkPageBreak(doc, y, 60)
    y = drawSectionTitle(doc, 'Attendance Summary', y)

    const attendance = attendanceData?.attendance || []
    const attSummary = attendanceData?.summary || {}
    const totalClasses = attSummary.totalClasses || 0
    const presentClasses = attSummary.presentClasses || 0
    const totalTests = attSummary.totalTests || 0
    const presentTests = attSummary.presentTests || 0
    const overallAtt = totalClasses + totalTests
    const overallPres = presentClasses + presentTests
    const overallRate = overallAtt > 0 ? Math.round((overallPres / overallAtt) * 100) : 0

    // Compact stat cards for attendance
    const attCardW = (CONTENT_WIDTH - 6) / 3
    const attCardH = 20
    drawStatCard(doc, MARGIN, y, attCardW, attCardH, 'Class', `${totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0}%`, COLORS.primaryLight, `${presentClasses}/${totalClasses}`)
    drawStatCard(doc, MARGIN + attCardW + 3, y, attCardW, attCardH, 'Test', `${totalTests > 0 ? Math.round((presentTests / totalTests) * 100) : 0}%`, COLORS.secondary, `${presentTests}/${totalTests}`)
    drawStatCard(doc, MARGIN + (attCardW + 3) * 2, y, attCardW, attCardH, 'Overall', `${overallRate}%`, overallRate >= 75 ? COLORS.success : COLORS.danger)

    y += attCardH + 6

    // Attendance remark
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    if (overallRate >= 90) {
        doc.setTextColor(...COLORS.success)
        doc.text('★ Excellent attendance record. Student is very regular and committed.', MARGIN, y)
    } else if (overallRate >= 75) {
        doc.setTextColor(...COLORS.primaryLight)
        doc.text('● Good attendance. Slight room for improvement in regularity.', MARGIN, y)
    } else if (overallRate >= 50) {
        doc.setTextColor(...COLORS.warning)
        doc.text('⚠ Below average attendance. Guardian consultation recommended.', MARGIN, y)
    } else {
        doc.setTextColor(...COLORS.danger)
        doc.text('✘ Poor attendance. Immediate intervention required.', MARGIN, y)
    }
    y += 10

    // ==============================
    // ACADEMIC PERFORMANCE
    // ==============================
    y = checkPageBreak(doc, y, 60)
    y = drawSectionTitle(doc, 'Academic Performance', y)

    const history = resultsData || []
    const resultsWithData = history.filter(h => h.type === 'result' && h.data)
    const percentages = resultsWithData.map(r => r.data.percentage || 0)
    const avgPct = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0
    const bestPct = percentages.length > 0 ? Math.max(...percentages) : 0
    const lowestPct = percentages.length > 0 ? Math.min(...percentages) : 0
    const bestTest = resultsWithData.find(r => r.data.percentage === bestPct)
    const worstTest = resultsWithData.find(r => r.data.percentage === lowestPct)

    // Performance cards
    const perfCardW = (CONTENT_WIDTH - 9) / 4
    const perfCardH = 20
    drawStatCard(doc, MARGIN, y, perfCardW, perfCardH, 'Tests', resultsWithData.length, COLORS.primaryLight, `of ${history.length}`)
    drawStatCard(doc, MARGIN + (perfCardW + 3), y, perfCardW, perfCardH, 'Avg', `${avgPct}%`, avgPct >= 60 ? COLORS.success : COLORS.warning)
    drawStatCard(doc, MARGIN + (perfCardW + 3) * 2, y, perfCardW, perfCardH, 'Best', `${bestPct}%`, COLORS.success)
    drawStatCard(doc, MARGIN + (perfCardW + 3) * 3, y, perfCardW, perfCardH, 'Low', `${lowestPct}%`, COLORS.danger)

    y += perfCardH + 6

    // Results table (compact)
    if (resultsWithData.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Test Name', 'Date', 'Score', '%', 'Grade', 'Rank']],
            body: resultsWithData.map(r => [
                r.test?.testName || 'N/A',
                formatShortDate(r.test?.date),
                `${r.data.totalMarks || 0}/${r.data.maxMarks || r.test?.totalMaxMarks || 0}`,
                `${r.data.percentage || 0}%`,
                r.data.grade || 'N/A',
                r.data.rank ? `#${r.data.rank}` : '-'
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.tableHeader,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 7.5,
                cellPadding: 2,
                halign: 'center',
            },
            alternateRowStyles: { fillColor: COLORS.tableStripe },
            margin: { left: MARGIN, right: MARGIN },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold' },
            },
        })
        y = doc.lastAutoTable.finalY + 10
    }

    // Academic remark
    y = checkPageBreak(doc, y, 20)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    if (avgPct >= 80) {
        doc.setTextColor(...COLORS.success)
        doc.text('★ Outstanding academic performance. Student consistently excels in examinations.', MARGIN, y)
    } else if (avgPct >= 60) {
        doc.setTextColor(...COLORS.primaryLight)
        doc.text('● Good academic performance. Student shows promise with room for growth.', MARGIN, y)
    } else if (avgPct >= 40) {
        doc.setTextColor(...COLORS.warning)
        doc.text('⚠ Average performance. More focused study and practice is recommended.', MARGIN, y)
    } else if (resultsWithData.length > 0) {
        doc.setTextColor(...COLORS.danger)
        doc.text('✘ Below expectations. One-on-one mentoring and guardian involvement needed.', MARGIN, y)
    }
    y += 10

    // ==============================
    // FINANCIAL SUMMARY
    // ==============================
    y = checkPageBreak(doc, y, 50)
    y = drawSectionTitle(doc, 'Financial Summary', y)

    const payments = paymentsData?.payments || []
    const totalFee = student.totalFee || 0
    const paidAmount = student.paidAmount || 0
    const dueAmount = student.dueAmount || 0
    const paymentRate = totalFee > 0 ? Math.round((paidAmount / totalFee) * 100) : 0

    const finCardW = (CONTENT_WIDTH - 6) / 3
    const finCardH = 20
    drawStatCard(doc, MARGIN, y, finCardW, finCardH, 'Total Fee', `৳${totalFee.toLocaleString()}`, COLORS.primaryLight)
    drawStatCard(doc, MARGIN + finCardW + 3, y, finCardW, finCardH, 'Paid', `৳${paidAmount.toLocaleString()}`, COLORS.success, `${paymentRate}%`)
    drawStatCard(doc, MARGIN + (finCardW + 3) * 2, y, finCardW, finCardH, 'Due', `৳${dueAmount.toLocaleString()}`, dueAmount > 0 ? COLORS.danger : COLORS.success)

    y += finCardH + 6

    // Payment history compact
    if (payments.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Date', 'Receipt ID', 'Amount', 'Method', 'Status']],
            body: payments.map(p => [
                formatShortDate(p.paymentDate),
                p.receiptId || 'N/A',
                `৳${p.amountPaid?.toLocaleString() || 0}`,
                p.paymentMethod?.replace('_', ' ') || 'N/A',
                p.isVerified ? 'Verified' : 'Pending'
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.tableHeader,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 7.5,
                cellPadding: 2,
                halign: 'center',
            },
            alternateRowStyles: { fillColor: COLORS.tableStripe },
            margin: { left: MARGIN, right: MARGIN },
        })
        y = doc.lastAutoTable.finalY + 10
    }

    // ==============================
    // OVERALL ASSESSMENT
    // ==============================
    y = checkPageBreak(doc, y, 50)
    y = drawSectionTitle(doc, 'Overall Assessment & Remarks', y)
    y += 2

    // Assessment box
    doc.setFillColor(...COLORS.veryLight)
    doc.setDrawColor(...COLORS.light)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 40, 3, 3, 'FD')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)

    const remarks = []
    if (overallRate >= 75 && avgPct >= 60) {
        remarks.push('The student demonstrates good discipline and academic commitment.')
    }
    if (overallRate < 75) {
        remarks.push('Attendance needs significant improvement. Regular class participation is crucial.')
    }
    if (avgPct < 50 && resultsWithData.length > 0) {
        remarks.push('Academic performance is below par. Additional coaching support is recommended.')
    }
    if (dueAmount > 0) {
        remarks.push(`Outstanding fee of ৳${dueAmount.toLocaleString()} needs to be cleared.`)
    }
    if (remarks.length === 0) {
        remarks.push('Overall satisfactory progress. Continue with the same dedication.')
    }
    remarks.push('')
    remarks.push('Guardian Signature: ____________________          Teacher Signature: ____________________')

    remarks.forEach((r, i) => {
        doc.text(r, MARGIN + 6, y + 8 + (i * 7))
    })

    // Footers
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addFooter(doc, i, totalPages, instituteName)
    }

    doc.save(`Overall_Progress_Report_${student.roll}_${student.name?.replace(/\s+/g, '_')}.pdf`)
}
