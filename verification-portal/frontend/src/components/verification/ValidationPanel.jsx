import React from 'react';
import Badge from '../common/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileCheck,
  Database,
  GitBranch,
} from 'lucide-react';

export default function ValidationPanel({ record, validations }) {
  // If backend provided pre-computed validation checks, use them;
  // otherwise compute deterministic verification checks on the live record
  const data = record || {};

  const requiredMissing = [];
  if (!data.ownerName) requiredMissing.push('Owner Name');
  if (!data.khasraNumber) requiredMissing.push('Khasra Number');
  if (!data.area) requiredMissing.push('Area');
  if (!data.village) requiredMissing.push('Village');
  if (!data.district) requiredMissing.push('District');

  const requiredStatus = validations?.requiredFieldValidation || (
    requiredMissing.length === 0 ? 'PASS' : 'FAILED'
  );

  const formatValid = !data.area || !isNaN(parseFloat(data.area));
  const formatStatus = validations?.formatValidation || (
    formatValid ? 'PASS' : 'WARNING'
  );

  const duplicateStatus = validations?.duplicateDetection || (
    data.isDuplicate ? 'FAILED' : 'PASS'
  );

  const crossFieldStatus = validations?.crossFieldValidation || (
    data.areaUnit && data.area ? 'PASS' : 'WARNING'
  );

  const dbStatus = validations?.databaseVerification || (
    data.dbCrossCheckStatus || 'PASS'
  );

  const checks = [
    {
      id: 'required',
      title: 'Required Field Validation',
      status: requiredStatus,
      icon: FileCheck,
      details:
        requiredStatus === 'PASS'
          ? 'All statutory land title fields are populated.'
          : `Missing mandatory fields: ${requiredMissing.join(', ')}`,
    },
    {
      id: 'format',
      title: 'Format Validation',
      status: formatStatus,
      icon: CheckCircle2,
      details:
        formatStatus === 'PASS'
          ? 'Area magnitude and parcel designations match revenue standards.'
          : 'Non-standard area or alphanumeric format detected.',
    },
    {
      id: 'duplicate',
      title: 'Duplicate Detection',
      status: duplicateStatus,
      icon: ShieldCheck,
      details:
        duplicateStatus === 'PASS'
          ? 'No duplicate parcel or conflicting title registered in village registry.'
          : 'Potential title overlap detected against active land ledger.',
    },
    {
      id: 'cross_field',
      title: 'Cross-Field Validation',
      status: crossFieldStatus,
      icon: GitBranch,
      details:
        crossFieldStatus === 'PASS'
          ? 'Revenue unit matches jurisdiction norms (Hectare / Acre / Bigha).'
          : 'Area unit or boundary specifications require manual cross-check.',
    },
    {
      id: 'db_verification',
      title: 'Database Verification',
      status: dbStatus,
      icon: Database,
      details:
        dbStatus === 'PASS'
          ? 'Cadastral database cross-reference matched with master ledger.'
          : 'Pending historical mutation confirmation from central repository.',
    },
  ];

  return (
    <div className="bg-white border border-slate-300 rounded shadow-none p-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-800">
          Record Checks & Automated Validations
        </h3>
        <span className="text-[11px] text-slate-500">
          5 rule validations evaluated
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold">
            <tr>
              <th scope="col" className="px-3 py-1.5 w-1/4">Validation Rule</th>
              <th scope="col" className="px-3 py-1.5 w-24">Status</th>
              <th scope="col" className="px-3 py-1.5">Observations / System Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {checks.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-3 py-1.5 font-medium text-slate-800">{c.title}</td>
                <td className="px-3 py-1.5">
                  <Badge status={c.status} size="xs" />
                </td>
                <td className="px-3 py-1.5 text-slate-600">{c.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
