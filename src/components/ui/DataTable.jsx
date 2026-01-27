import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter, Download, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DataTable({ 
  columns, 
  data, 
  onRowClick,
  searchable = true,
  filterable = true,
  exportable = false,
  emptyMessage = "No data available",
  loading = false,
  pagination = true,
  pageSize = 10
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="w-4 h-4 text-gray-500" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-emerald-400" />
      : <ChevronDown className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      {(searchable || filterable || exportable) && (
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {filterable && (
              <Button variant="outline" size="sm" className="border-white/10 text-gray-400">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            )}
            {exportable && (
              <Button variant="outline" size="sm" className="border-white/10 text-gray-400">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider",
                    col.sortable !== false && "cursor-pointer hover:text-white"
                  )}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable !== false && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-white/5"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-white/10"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8",
                      currentPage === page && "bg-emerald-500 text-black"
                    )}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}