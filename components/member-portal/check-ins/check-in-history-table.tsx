'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Search, Calendar, Clock } from 'lucide-react';
import { getUiSvg } from '@/lib/svg-icons';
import { exportCheckInsToCSV } from '@/lib/actions/members-portal';
import { toast } from '@/components/ui/toaster';

interface CheckInHistoryTableProps {
  checkIns: any[];
  memberId: string;
  gymId: string;
}

export function CheckInHistoryTable({
  checkIns,
  memberId,
  gymId,
}: CheckInHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredCheckIns = checkIns.filter((checkIn) => {
    const searchLower = searchTerm.toLowerCase();
    const date = formatDate(checkIn.check_in_at).toLowerCase();
    const notes = (checkIn.notes || '').toLowerCase();
    return date.includes(searchLower) || notes.includes(searchLower);
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportCheckInsToCSV(memberId, gymId);

      if (!result.success || !result.csv) {
        toast.error('Failed to export check-ins');
        return;
      }

      // Create CSV content
      const csvContent = [
        result.csv.headers.join(','),
        ...result.csv.rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(',')
        ),
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `check-ins-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Check-ins exported successfully');
    } catch (error) {
      toast.error('Failed to export check-ins');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Check-in Records</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by date or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={exporting || checkIns.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCheckIns.length === 0 ? (
          <div className="text-center py-12">
            <img src={getUiSvg('check-ins')} alt="" className="h-12 w-12 opacity-50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm ? 'No matching check-ins' : 'No check-ins yet'}
            </h3>
            <p className="text-slate-400">
              {searchTerm
                ? 'Try a different search term'
                : 'Your check-in history will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCheckIns.map((checkIn) => {
                  const scanData = Array.isArray(checkIn.scans)
                    ? checkIn.scans[0]
                    : checkIn.scans;

                  return (
                    <TableRow key={checkIn.id}>
                      <TableCell className="font-medium">
                        {formatDate(checkIn.check_in_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-slate-500" />
                          {formatTime(checkIn.check_in_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {checkIn.check_out_at ? (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-slate-500" />
                            {formatTime(checkIn.check_out_at)}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDuration(checkIn.duration_minutes)}
                      </TableCell>
                      <TableCell>
                        {scanData ? (
                          <div className="text-xs text-slate-400">
                            <div>{scanData.device_type || 'Unknown'}</div>
                            <div className="text-slate-500">
                              {scanData.browser}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {checkIn.notes ? (
                          <span className="text-sm text-slate-400">
                            {checkIn.notes}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredCheckIns.length > 0 && (
          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredCheckIns.length} of {checkIns.length} check-ins
          </div>
        )}
      </CardContent>
    </Card>
  );
}
