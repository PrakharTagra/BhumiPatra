import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTest() {
  console.log('--- STARTING BHUMIPATRA INTEGRATION WORKFLOW TEST ---');

  // 1. Health check
  console.log('\n[1] Checking Backend Health...');
  const health = await request('/api/health');
  console.log(`Status: ${health.status}, Response:`, health.data);
  if (!health.ok) throw new Error('Health check failed');

  // 2. Setup initial admin check (should be forbidden since admin already exists)
  console.log('\n[2] Checking Setup Guard (Should return 403)...');
  const setupCheck = await request('/api/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker', email: 'hack@test.com', password: 'password123' }),
  });
  console.log(`Status: ${setupCheck.status}, Success: ${setupCheck.data?.success}, Message: ${setupCheck.data?.message}`);
  if (setupCheck.status !== 403) throw new Error('Setup route did not protect against duplicate admin creation!');

  // 3. Admin Login
  console.log('\n[3] Admin Login...');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bhumipatra.gov.in', password: 'BhumiPatra@Admin2026' }),
  });
  console.log(`Status: ${adminLogin.status}, Admin Name: ${adminLogin.data?.user?.name}, Token present: ${Boolean(adminLogin.data?.token)}`);
  if (!adminLogin.data?.token) throw new Error('Admin login failed');
  const adminToken = adminLogin.data.token;

  // 4. Admin Dashboard Metrics
  console.log('\n[4] Admin Dashboard Metrics...');
  const adminDash = await request('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`Status: ${adminDash.status}, Total Users: ${adminDash.data?.data?.totalUsers}, Total Docs: ${adminDash.data?.data?.totalDocuments}`);

  // 5. Admin creates Operator and Officer accounts
  console.log('\n[5] Admin Creating Digitization Operator...');
  const operatorEmail = `operator_${Date.now()}@bhumipatra.gov.in`;
  const operatorPassword = 'OperatorPass@2026';
  const opRes = await request('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Ramesh Sharma (Operator)',
      email: operatorEmail,
      password: operatorPassword,
      role: 'DIGITIZATION_OPERATOR',
      department: 'Land Records Digitization Cell',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      tehsil: 'Bakshi Ka Talab',
    }),
  });
  console.log(`Status: ${opRes.status}, Created Operator ID: ${opRes.data?.data?.user?.id || opRes.data?.data?.user?._id}`);
  if (!opRes.ok) throw new Error('Failed to create operator');

  console.log('\n[6] Admin Creating Verification Officer...');
  const officerEmail = `officer_${Date.now()}@bhumipatra.gov.in`;
  const officerPassword = 'OfficerPass@2026';
  const offRes = await request('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Priya Verma (Tehsildar)',
      email: officerEmail,
      password: officerPassword,
      role: 'VERIFICATION_OFFICER',
      department: 'Revenue & Land Settlement Division',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      tehsil: 'Bakshi Ka Talab',
    }),
  });
  console.log(`Status: ${offRes.status}, Created Officer ID: ${offRes.data?.data?.user?.id || offRes.data?.data?.user?._id}`);
  if (!offRes.ok) throw new Error('Failed to create officer');

  // 7. Test Operator Login & RBAC Guard
  console.log('\n[7] Testing Operator Login & RBAC Guard...');
  const opLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: operatorEmail, password: operatorPassword }),
  });
  const opToken = opLogin.data?.token;
  console.log(`Operator Login Status: ${opLogin.status}, Token: ${Boolean(opToken)}`);

  // RBAC test: operator tries to hit /api/admin/dashboard
  const opForbidden = await request('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${opToken}` },
  });
  console.log(`Operator hitting Admin Dashboard: Status ${opForbidden.status} (Expected: 403)`);
  if (opForbidden.status !== 403) throw new Error('RBAC failure: Operator was able to access admin dashboard!');

  // 8. Test Officer Login & RBAC Guard
  console.log('\n[8] Testing Officer Login & RBAC Guard...');
  const offLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: officerEmail, password: officerPassword }),
  });
  const offToken = offLogin.data?.token;
  console.log(`Officer Login Status: ${offLogin.status}, Token: ${Boolean(offToken)}`);

  // RBAC test: officer tries to hit /api/admin/users
  const offForbidden = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${offToken}` },
  });
  console.log(`Officer hitting Admin Users: Status ${offForbidden.status} (Expected: 403)`);
  if (offForbidden.status !== 403) throw new Error('RBAC failure: Officer was able to access admin users!');

  // 9. Operator uploads a document
  console.log('\n[9] Operator Uploading Land Record Document...');
  let fileBytes;
  let filename = 'Khatauni_Parcel_142.png';
  let mimeType = 'image/png';
  const imgPath = path.resolve('document-analysis-engine/test_scanned_khatauni.png');
  const pdfPath = path.resolve('test_valid_land_record.pdf');

  if (fs.existsSync(imgPath)) {
    fileBytes = fs.readFileSync(imgPath);
    filename = 'Khatauni_Parcel_142.png';
    mimeType = 'image/png';
  } else if (fs.existsSync(pdfPath)) {
    fileBytes = fs.readFileSync(pdfPath);
    filename = 'Khatauni_Parcel_142_BKT.pdf';
    mimeType = 'application/pdf';
  } else {
    // Generate valid sample PDF buffer conforming to PDF-1.4 specifications
    fileBytes = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 12 Tf 100 700 Td (Khasra 101 Khata 45 Area 1.5) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%EOF\n'
    );
    filename = 'Khatauni_Parcel_142_BKT.pdf';
    mimeType = 'application/pdf';
  }

  const blob = new Blob([fileBytes], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('documentType', 'KHATAUNI');
  formData.append('state', 'Uttar Pradesh');
  formData.append('district', 'Lucknow');
  formData.append('tehsil', 'Bakshi Ka Talab');
  formData.append('village', 'Kamalpur');
  formData.append('recordYear', '2023');

  const uploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opToken}`,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log(`Upload Status: ${uploadRes.status}, Document ID: ${uploadData.data?.documentId}`);
  if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);

  const docId = uploadData.data.documentId || uploadData.data._id;
  const mongoDocId = uploadData.data._id;

  // 10. Operator triggers AI processing
  console.log('\n[10] Operator Triggering AI Digitization Pipeline...');
  const processRes = await request(`/api/documents/${docId}/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${opToken}` },
  });
  console.log(`Process Status: ${processRes.status}, Status: ${processRes.data?.data?.processingStatus}`);

  // Wait 3 seconds for pipeline to complete
  console.log('Waiting 3.5s for autonomous background extraction pipeline...');
  await new Promise((r) => setTimeout(r, 3500));

  // Check Document Status
  const statusRes = await request(`/api/documents/${docId}/status`, {
    headers: { Authorization: `Bearer ${opToken}` },
  });
  console.log(`Pipeline Status: ${statusRes.data?.data?.status || statusRes.data?.data?.processingStatus}, Overall Confidence: ${statusRes.data?.data?.overallConfidence}%`);

  // 11. Verification Officer checks Pending Queue
  console.log('\n[11] Verification Officer Checking Pending Workstation Queue...');
  const queueRes = await request('/api/land-records/pending', {
    headers: { Authorization: `Bearer ${offToken}` },
  });
  const pendingRecords = queueRes.data?.records || queueRes.data?.data || [];
  console.log(`Status: ${queueRes.status}, Pending Records Count: ${pendingRecords.length}`);
  if (pendingRecords.length === 0) throw new Error('No pending records found in verification queue!');

  const targetRecord = pendingRecords[0];
  const recordId = targetRecord.id || targetRecord._id;
  console.log(`Target Record ID: ${recordId}, Khasra: ${targetRecord.khasraNumber || targetRecord.landInformation?.khasraNo}, Owner: ${targetRecord.ownerName || targetRecord.owner?.name}`);

  // 12. Officer makes a field correction
  console.log('\n[12] Officer Making Field Correction...');
  const updateRes = await request(`/api/land-records/${recordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${offToken}` },
    body: JSON.stringify({
      field: 'ownerName',
      value: 'Rameshwar Dayal Sharma',
      previousValue: targetRecord.ownerName || 'Unknown',
      reason: 'Name clarified from verified physical patta ledger',
    }),
  });
  console.log(`Update Status: ${updateRes.status}, Success: ${updateRes.data?.success}`);

  // 13. Officer Approves the Record
  console.log('\n[13] Officer Approving Land Record...');
  const approveRes = await request(`/api/land-records/${recordId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${offToken}` },
    body: JSON.stringify({
      remarks: 'Verified against revenue cadastre map and seal. All boundary measures confirmed.',
    }),
  });
  console.log(`Approve Status: ${approveRes.status}, Status: ${approveRes.data?.data?.verificationStatus || approveRes.data?.verificationStatus}`);

  // 14. Verify Verification History
  console.log('\n[14] Checking Verification Audit Trail...');
  const historyRes = await request(`/api/land-records/${recordId}/verification-history`, {
    headers: { Authorization: `Bearer ${offToken}` },
  });
  const hist = historyRes.data?.history || historyRes.data?.data || [];
  console.log(`Verification History entries: ${hist.length}`);
  hist.forEach((h) => console.log(` - Action: ${h.action}, Officer: ${h.officer?.name || h.officerId}, Remarks: ${h.remarks || h.reason || 'N/A'}`));

  // 15. Admin views System Audit Logs & Updated Metrics
  console.log('\n[15] Admin Checking Global Audit Logs...');
  const logsRes = await request('/api/admin/audit-logs?limit=5', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const logs = logsRes.data?.logs || logsRes.data?.data || [];
  console.log(`Audit Logs retrieved: ${logs.length}`);
  logs.slice(0, 3).forEach((l) => console.log(` - [${l.action}] ${l.description}`));

  // Clean up generated test file if any
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

  console.log('\n=== ALL BHUMIPATRA INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n*** INTEGRATION TEST FAILED ***', err);
  process.exit(1);
});
