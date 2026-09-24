import React from 'react';

export default function Table({
  columns = [],
  data = [],
  keyExtractor,
  renderRow,
  className = '',
  emptyState,
}) {
  if (!data || data.length === 0) {
    return emptyState || null;
  }

  return (
    <div className={`overflow-x-auto w-full border-t border-slate-200 ${className}`}>
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                scope="col"
                className={`py-3.5 px-4 font-semibold text-slate-700 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((item, index) => {
            const key = keyExtractor ? keyExtractor(item, index) : item._id || item.id || index;
            if (renderRow) {
              return renderRow(item, index);
            }
            return (
              <tr key={key} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col, cIndex) => (
                  <td key={col.key || cIndex} className={`py-3 px-4 text-slate-700 ${col.cellClassName || ''}`}>
                    {col.render ? col.render(item, index) : item[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
