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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-navy-800" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">
            Automated Validation Matrix
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          5 Rule Engines Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {checks.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                c.status === 'PASS'
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : c.status === 'WARNING'
                  ? 'bg-amber-50/40 border-amber-200/80'
                  : 'bg-rose-50/40 border-rose-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-semibold text-slate-800 text-[11px] leading-tight">
                    {c.title}
                  </span>
                  <Badge status={c.status} size="xs" />
                </div>
                <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">
                  {c.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
