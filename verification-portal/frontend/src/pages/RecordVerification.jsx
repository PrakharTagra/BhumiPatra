import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import verificationApi from '../api/verificationApi';
import DocumentViewer from '../components/verification/DocumentViewer';
import ValidationPanel from '../components/verification/ValidationPanel';
import {
  ApproveModal,
  RejectModal,
  SendBackModal,
} from '../components/verification/ActionModals';
import AuditHistoryModal from '../components/verification/AuditHistoryModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import ErrorAlert from '../components/common/ErrorAlert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowLeftCircle,
  History,
  FileText,
  Edit2,
  Save,
  X,
  MapPin,
  Users,
  Grid3X3,
  FileCheck2,
} from 'lucide-react';

export default function RecordVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSendBackOpen, setIsSendBackOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Row edit state
  const [editingLandholder, setEditingLandholder] = useState(null);
  const [editingParcel, setEditingParcel] = useState(null);
  const [editingJurisdiction, setEditingJurisdiction] = useState(false);
  const [jurisdictionForm, setJurisdictionForm] = useState({
    state: '',
    district: '',
    tehsil: '',
    village: '',
  });

  // Audit history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchRecordData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await verificationApi.getRecordById(id);
      const data = response?.record || response?.data || response;

      setRecord(data);
      setJurisdictionForm({
        state: data.state || '',
        district: data.district || '',
        tehsil: data.tehsil || '',
        village: data.village || '',
      });

      // Load audit history
      try {
        setHistoryLoading(true);
        const histRes = await verificationApi.getVerificationHistory(id);
        const histList = histRes?.history || histRes?.data || (Array.isArray(histRes) ? histRes : []);
        setHistory(histList);
      } catch (histErr) {
        console.warn('Could not fetch verification history:', histErr);
      } finally {
        setHistoryLoading(false);
      }
    } catch (err) {
      setError(err.customMessage || 'Failed to retrieve land record details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecordData();
  }, [fetchRecordData]);

  // Actions
  const handleApprove = async ({ remarks }) => {
    setActionLoading(true);
    try {
      await verificationApi.approveRecord(id, { remarks });
      showSuccess('Land record approved and signed successfully.');
      setIsApproveOpen(false);
      fetchRecordData();
    } catch (err) {
      showError(err.customMessage || 'Failed to approve land record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async ({ reason, remarks }) => {
    setActionLoading(true);
    try {
      await verificationApi.rejectRecord(id, { reason, remarks });
      showSuccess('Land record marked as rejected.');
      setIsRejectOpen(false);
      fetchRecordData();
    } catch (err) {
      showError(err.customMessage || 'Failed to reject land record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBack = async ({ remarks }) => {
    setActionLoading(true);
    try {
      await verificationApi.sendBackRecord(id, { remarks });
      showSuccess('Record returned to Digitization Operator for correction.');
      setIsSendBackOpen(false);
      fetchRecordData();
    } catch (err) {
      showError(err.customMessage || 'Failed to return land record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Landholder Edit
  const handleSaveLandholder = async () => {
    if (!editingLandholder) return;
    const currentList = [...(record.landholders || [])];
    const idx = currentList.findIndex((lh) => lh.srNo === editingLandholder.srNo);
    if (idx >= 0) {
      currentList[idx] = editingLandholder;
    } else {
      currentList.push(editingLandholder);
    }

    try {
      await verificationApi.updateRecord(id, {
        landholders: currentList,
        reason: `Updated landholder #${editingLandholder.srNo} (${editingLandholder.name})`,
      });
      setRecord((prev) => ({
        ...prev,
        landholders: currentList,
        ownerName: currentList[0]?.name || prev.ownerName,
        fatherGuardianName: currentList[0]?.fatherGuardianName || prev.fatherGuardianName,
      }));
      showSuccess('Landholder details updated.');
      setEditingLandholder(null);
    } catch (err) {
      showError(err.customMessage || 'Failed to update landholder.');
    }
  };

  // Parcel Edit
  const handleSaveParcel = async () => {
    if (!editingParcel) return;
    const currentList = [...(record.landParcels || [])];
    const idx = currentList.findIndex((p) => p.srNo === editingParcel.srNo);
    if (idx >= 0) {
      currentList[idx] = editingParcel;
    } else {
      currentList.push(editingParcel);
    }

    try {
      await verificationApi.updateRecord(id, {
        landParcels: currentList,
        reason: `Updated parcel #${editingParcel.srNo} (${editingParcel.khasraNumber})`,
      });
      setRecord((prev) => ({
        ...prev,
        landParcels: currentList,
        khasraNumber: currentList[0]?.khasraNumber || prev.khasraNumber,
        khataNumber: currentList[0]?.khataNumber || prev.khataNumber,
        area: currentList[0]?.area ?? prev.area,
      }));
      showSuccess('Parcel details updated.');
      setEditingParcel(null);
    } catch (err) {
      showError(err.customMessage || 'Failed to update parcel.');
    }
  };

  // Jurisdiction Edit
  const handleSaveJurisdiction = async () => {
    try {
      await verificationApi.updateRecord(id, {
        location: jurisdictionForm,
        reason: 'Updated revenue jurisdiction location',
      });
      setRecord((prev) => ({
        ...prev,
        state: jurisdictionForm.state,
        district: jurisdictionForm.district,
        tehsil: jurisdictionForm.tehsil,
        village: jurisdictionForm.village,
      }));
      showSuccess('Revenue jurisdiction updated.');
      setEditingJurisdiction(false);
    } catch (err) {
      showError(err.customMessage || 'Failed to update jurisdiction.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">
          Loading cadastral record from repository...
        </p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-4">
        <ErrorAlert
          title="Unable to load land record"
          message={error || 'Record not found in the database.'}
          onRetry={fetchRecordData}
        />
        <div className="text-center">
          <Link to="/queue">
            <Button variant="secondary" size="xs" icon={ArrowLeft}>
              Back to Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const reviewStatus = record.reviewStatus || record.verificationStatus || 'PENDING';
  const landholders = record.landholders && record.landholders.length > 0
    ? record.landholders
    : [{
        srNo: 1,
        name: record.ownerName || 'Not detected',
        fatherGuardianName: record.fatherGuardianName || record.relativeName || 'Not detected',
        ownershipType: record.ownershipDetails || 'Bhumidhar',
        share: '1/1',
      }];

  const landParcels = record.landParcels && record.landParcels.length > 0
    ? record.landParcels
    : [{
        srNo: 1,
        khasraNumber: record.khasraNumber || 'Not detected',
        khataNumber: record.khataNumber || 'Not detected',
        ownerName: record.ownerName || 'Not detected',
        area: record.area !== null && record.area !== undefined ? record.area : 'Not detected',
        areaUnit: record.areaUnit || 'Hectare',
        classification: record.landClassification || 'Agricultural',
        landUse: 'Cultivable',
      }];

  const mutations = record.mutations && record.mutations.length > 0
    ? record.mutations
    : (record.mutationDetails ? [{
        srNo: 1,
        mutationNo: record.mutationDetails,
        mutationDate: 'Recorded',
        orderAuthority: 'Tehsildar',
        status: 'Recorded',
      }] : []);

  const registrations = record.registrations && record.registrations.length > 0
    ? record.registrations
    : (record.registrationDetails ? [{
        srNo: 1,
        registrationNo: record.registrationDetails,
        registrationDate: 'Recorded',
        subRegistrarOffice: record.tehsil || 'Sub-Registrar Office',
        status: 'Registered',
      }] : []);

  return (
    <div className="space-y-4">
      {/* Top Header & Officer Actions */}
      <div className="bg-white border border-slate-300 rounded p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/queue">
            <Button variant="secondary" size="xs" icon={ArrowLeft} className="p-1.5">
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 font-mono">
                {record.documentNumber || `RECORD-${id}`}
              </h1>
              <Badge status={reviewStatus} size="xs" />
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {record.district ? `${record.district} • ${record.tehsil || 'Tehsil'} • ${record.village || 'Village'}` : 'Cadastral Land Record'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="xs"
            icon={History}
            onClick={() => setIsHistoryOpen(true)}
          >
            Audit Trail ({history.length})
          </Button>

          <Button
            variant="warning"
            size="xs"
            icon={ArrowLeftCircle}
            onClick={() => setIsSendBackOpen(true)}
          >
            Return for Correction
          </Button>

          <Button
            variant="danger"
            size="xs"
            icon={XCircle}
            onClick={() => setIsRejectOpen(true)}
          >
            Reject Record
          </Button>

          <Button
            variant="success"
            size="xs"
            icon={CheckCircle2}
            onClick={() => setIsApproveOpen(true)}
          >
            Approve Record
          </Button>
        </div>
      </div>

      {/* Main Verification Workstation: 55% Original Document + 45% Extracted Record */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* LEFT PANEL: 55% Original Document Viewer */}
        <div className="w-full lg:w-[55%] h-[780px] flex-shrink-0">
          <DocumentViewer
            documentUrl={record.documentUrl || record.fileUrl}
            documentType={record.documentType || 'Scanned Land Record'}
            totalPages={record.totalPages || 1}
          />
        </div>

        {/* RIGHT PANEL: 45% Administrative Extracted Record Details */}
        <div className="w-full lg:w-[45%] h-[780px] flex flex-col bg-white border border-slate-300 rounded overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Extracted Land Record Data
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Government Revenue Format
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* SECTION 1: Landholder / Ownership Details Table */}
            <div className="border border-slate-200 rounded">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Landholder / Ownership Details</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {landholders.length} record(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 text-slate-600 font-medium text-[11px]">
                    <tr>
                      <th className="px-2.5 py-1.5 w-10">Sr.</th>
                      <th className="px-2.5 py-1.5">Landholder Name</th>
                      <th className="px-2.5 py-1.5">Father / Guardian</th>
                      <th className="px-2.5 py-1.5">Tenure</th>
                      <th className="px-2.5 py-1.5 w-14">Share</th>
                      <th className="px-2.5 py-1.5 w-12 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {landholders.map((lh, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-2.5 py-1.5 font-mono text-slate-500">{lh.srNo || idx + 1}</td>
                        <td className="px-2.5 py-1.5 font-medium text-slate-900">{lh.name || '—'}</td>
                        <td className="px-2.5 py-1.5 text-slate-700">{lh.fatherGuardianName || '—'}</td>
                        <td className="px-2.5 py-1.5 text-slate-600">{lh.ownershipType || '—'}</td>
                        <td className="px-2.5 py-1.5 font-mono text-slate-700">{lh.share || '—'}</td>
                        <td className="px-2.5 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingLandholder({ ...lh, srNo: lh.srNo || idx + 1 })}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
                            title="Edit Landholder"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: Plot / Khasra Details Table */}
            <div className="border border-slate-200 rounded">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Grid3X3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Plot / Khasra Details</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {landParcels.length} parcel(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 text-slate-600 font-medium text-[11px]">
                    <tr>
                      <th className="px-2 py-1.5 w-8">Sr.</th>
                      <th className="px-2 py-1.5">Khasra</th>
                      <th className="px-2 py-1.5">Khata</th>
                      <th className="px-2 py-1.5">Area</th>
                      <th className="px-2 py-1.5">Class</th>
                      <th className="px-2 py-1.5">Land Use</th>
                      <th className="px-2 py-1.5 w-10 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {landParcels.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="px-2 py-1.5 font-mono text-slate-500">{p.srNo || idx + 1}</td>
                        <td className="px-2 py-1.5 font-mono font-medium text-slate-900">{p.khasraNumber || '—'}</td>
                        <td className="px-2 py-1.5 font-mono text-slate-700">{p.khataNumber || '—'}</td>
                        <td className="px-2 py-1.5 font-mono text-slate-800">
                          {p.area !== null && p.area !== undefined ? `${p.area} ${p.areaUnit || 'Hectare'}` : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-slate-600">{p.classification || '—'}</td>
                        <td className="px-2 py-1.5 text-slate-600">{p.landUse || '—'}</td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingParcel({ ...p, srNo: p.srNo || idx + 1 })}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded"
                            title="Edit Parcel"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: Revenue Jurisdiction Details */}
            <div className="border border-slate-200 rounded">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  <span>Revenue Jurisdiction</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingJurisdiction(true)}
                  className="text-[11px] text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-2.5 h-2.5" /> Edit Location
                </button>
              </div>
              <div className="p-2.5 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">State:</span>
                  <span className="font-medium text-slate-800">{record.state || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">District:</span>
                  <span className="font-medium text-slate-800">{record.district || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tehsil:</span>
                  <span className="font-medium text-slate-800">{record.tehsil || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Village:</span>
                  <span className="font-medium text-slate-800">{record.village || 'Not detected'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Mutation & Registration Details */}
            <div className="border border-slate-200 rounded">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Mutation & Registration Details</span>
                </div>
              </div>
              <div className="p-2.5 space-y-2 text-xs">
                {mutations.length > 0 ? (
                  mutations.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Mutation No.:</span>
                        <span className="font-mono font-medium text-slate-900">{m.mutationNo}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[11px] block">Date:</span>
                        <span className="text-slate-700">{m.mutationDate || 'Recorded'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic text-[11px]">No active mutation orders recorded.</div>
                )}

                {registrations.length > 0 ? (
                  registrations.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Registration No.:</span>
                        <span className="font-mono font-medium text-slate-900">{r.registrationNo}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[11px] block">Date:</span>
                        <span className="text-slate-700">{r.registrationDate || 'Registered'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic text-[11px]">No prior deed registration references.</div>
                )}
              </div>
            </div>

            {/* SECTION 5: Cadastral Check & Validation Status */}
            <div>
              <ValidationPanel record={record} validations={record.validations} />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Edit Landholder */}
      {editingLandholder && (
        <Modal
          isOpen={Boolean(editingLandholder)}
          onClose={() => setEditingLandholder(null)}
          title={`Edit Landholder #${editingLandholder.srNo}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="xs" onClick={() => setEditingLandholder(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="xs" onClick={handleSaveLandholder}>
                Save Landholder
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Landholder Name</label>
              <Input
                value={editingLandholder.name || ''}
                onChange={(e) => setEditingLandholder({ ...editingLandholder, name: e.target.value })}
                placeholder="Full Landholder Name"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Father / Guardian Name</label>
              <Input
                value={editingLandholder.fatherGuardianName || ''}
                onChange={(e) => setEditingLandholder({ ...editingLandholder, fatherGuardianName: e.target.value })}
                placeholder="Father or Guardian Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Ownership Type</label>
                <Input
                  value={editingLandholder.ownershipType || ''}
                  onChange={(e) => setEditingLandholder({ ...editingLandholder, ownershipType: e.target.value })}
                  placeholder="e.g. Bhumidhar"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Share</label>
                <Input
                  value={editingLandholder.share || ''}
                  onChange={(e) => setEditingLandholder({ ...editingLandholder, share: e.target.value })}
                  placeholder="e.g. 1/2"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Edit Parcel */}
      {editingParcel && (
        <Modal
          isOpen={Boolean(editingParcel)}
          onClose={() => setEditingParcel(null)}
          title={`Edit Parcel #${editingParcel.srNo}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="xs" onClick={() => setEditingParcel(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="xs" onClick={handleSaveParcel}>
                Save Parcel
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Khasra Number</label>
                <Input
                  value={editingParcel.khasraNumber || ''}
                  onChange={(e) => setEditingParcel({ ...editingParcel, khasraNumber: e.target.value })}
                  placeholder="e.g. 127/2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Khata Number</label>
                <Input
                  value={editingParcel.khataNumber || ''}
                  onChange={(e) => setEditingParcel({ ...editingParcel, khataNumber: e.target.value })}
                  placeholder="e.g. 184"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Area</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editingParcel.area || ''}
                  onChange={(e) => setEditingParcel({ ...editingParcel, area: parseFloat(e.target.value) || 0 })}
                  placeholder="0.0000"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Area Unit</label>
                <Input
                  value={editingParcel.areaUnit || 'Hectare'}
                  onChange={(e) => setEditingParcel({ ...editingParcel, areaUnit: e.target.value })}
                  placeholder="Hectare"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Classification</label>
                <Input
                  value={editingParcel.classification || ''}
                  onChange={(e) => setEditingParcel({ ...editingParcel, classification: e.target.value })}
                  placeholder="e.g. Agricultural"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Land Use</label>
                <Input
                  value={editingParcel.landUse || ''}
                  onChange={(e) => setEditingParcel({ ...editingParcel, landUse: e.target.value })}
                  placeholder="e.g. Cultivable"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Edit Jurisdiction */}
      {editingJurisdiction && (
        <Modal
          isOpen={editingJurisdiction}
          onClose={() => setEditingJurisdiction(false)}
          title="Edit Revenue Jurisdiction"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="xs" onClick={() => setEditingJurisdiction(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="xs" onClick={handleSaveJurisdiction}>
                Save Location
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">State</label>
              <Input
                value={jurisdictionForm.state}
                onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">District</label>
              <Input
                value={jurisdictionForm.district}
                onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, district: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Tehsil</label>
              <Input
                value={jurisdictionForm.tehsil}
                onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, tehsil: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Village</label>
              <Input
                value={jurisdictionForm.village}
                onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, village: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modals */}
      <ApproveModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
        loading={actionLoading}
        recordId={record.documentNumber || id}
      />

      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        loading={actionLoading}
        recordId={record.documentNumber || id}
      />

      <SendBackModal
        isOpen={isSendBackOpen}
        onClose={() => setIsSendBackOpen(false)}
        onConfirm={handleSendBack}
        loading={actionLoading}
        recordId={record.documentNumber || id}
      />

      <AuditHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        loading={historyLoading}
        recordId={record.documentNumber || id}
      />
    </div>
  );
}
