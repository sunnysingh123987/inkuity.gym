// Export Utilities for Analytics Data

// ============================================================
// CSV EXPORT
// ============================================================

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// FORMAT ANALYTICS FOR EXPORT
// ============================================================

export function formatCheckInsForExport(data: { date: string; count: number }[]) {
  return data.map((item) => ({
    Date: item.date,
    'Check-Ins': item.count,
  }));
}

export function formatMemberGrowthForExport(
  data: { date: string; newMembers: number; returningMembers: number; total: number }[]
) {
  return data.map((item) => ({
    Date: item.date,
    'New Members': item.newMembers,
    'Returning Members': item.returningMembers,
    Total: item.total,
  }));
}

export function formatPeakHoursForExport(data: { hour: number; count: number }[]) {
  return data.map((item) => ({
    Hour: `${item.hour}:00`,
    'Check-Ins': item.count,
  }));
}

export function formatDeviceBreakdownForExport(
  data: { name: string; value: number; percentage: number }[]
) {
  return data.map((item) => ({
    Device: item.name,
    Count: item.value,
    Percentage: `${item.percentage}%`,
  }));
}

export function formatTopMembersForExport(
  data: { name: string; email: string; checkIns: number; lastCheckIn: string }[]
) {
  return data.map((item) => ({
    Name: item.name,
    Email: item.email,
    'Total Check-Ins': item.checkIns,
    'Last Check-In': item.lastCheckIn,
  }));
}
