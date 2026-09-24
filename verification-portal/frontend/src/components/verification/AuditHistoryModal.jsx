import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { History, ArrowRight } from 'lucide-react';

export default function AuditHistoryModal({
  isOpen,
  onClose,
  history = [],
  loading = false,
  recordId,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verification Audit Trail"
      subtitle={`Tamper-evident record of officer corrections &bull; Record ID: ${recordId}`}
      maxWidth="max-w-3xl"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading audit history...</div>
        ) : history.length === 0 ? (
          <EmptyState
            type="history"
            title="No modifications logged"
            message="No field corrections or officer adjustments have been registered for this record yet."
          />
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Field</th>
                  <th className="py-2.5 px-3 font-semibold">Previous Value</th>
                  <th className="py-2.5 px-3 font-semibold">New Value</th>
                  <th className="py-2.5 px-3 font-semibold">Officer</th>
                  <th className="py-2.5 px-3 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.map((item, idx) => (
                  <tr key={item._id || item.id || idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.field || item.fieldName || 'Field'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 line-through">
                      {item.previousValue !== undefined ? String(item.previousValue) : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-emerald-800 bg-emerald-50/50">
                      {item.newValue !== undefined ? String(item.newValue) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {item.officer?.name || item.officerName || item.officerId || 'Verification Officer'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs break-words">
                      {item.reason || item.remarks || 'Field correction'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
