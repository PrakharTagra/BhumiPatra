import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Users as UsersIcon,
  Shield,
  Building2,
  MapPin,
  Calendar,
  Lock,
} from 'lucide-react';

const ROLES = [
  { value: 'DIGITIZATION_OPERATOR', label: 'Digitization Operator' },
  { value: 'VERIFICATION_OFFICER', label: 'Verification Officer' },
  { value: 'ADMIN', label: 'Administrator' },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DIGITIZATION_OPERATOR',
    department: '',
    district: '',
    tehsil: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const { showSuccess, showError } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await adminApi.getUsers(params);
      const userList = response?.users || response?.data || (Array.isArray(response) ? response : []);
      const total = response?.total || response?.totalCount || userList.length;
      const pages = response?.totalPages || Math.ceil(total / pageSize) || 1;

      setUsers(userList);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      setError(err.customMessage || 'Failed to fetch user accounts.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Official email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Valid email address format required.';
    }
    if (!formData.password) {
      errs.password = 'Initial password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (!formData.role) errs.role = 'Role selection is required.';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      await adminApi.createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        department: formData.department.trim(),
        district: formData.district.trim(),
        tehsil: formData.tehsil.trim(),
      });

      showSuccess(`User account for ${formData.name} created successfully.`);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'DIGITIZATION_OPERATOR',
        department: '',
        district: '',
        tehsil: '',
      });
      fetchUsers();
    } catch (err) {
      const msg = err.customMessage || 'Failed to create user account.';
      showError(msg);
      if (err.validationErrors) {
        setFormErrors(err.validationErrors);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMessage = `Are you sure you want to ${
      newStatus === 'ACTIVE' ? 'activate' : 'deactivate'
    } account for "${user.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await adminApi.updateUserStatus(user._id || user.id, newStatus);
      showSuccess(`User ${user.name} is now ${newStatus.toLowerCase()}.`);
      // Update local state smoothly
      setUsers((prev) =>
        prev.map((u) => ((u._id || u.id) === (user._id || user.id) ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      showError(err.customMessage || 'Failed to update user status.');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const columns = [
    {
      header: 'User Details',
      key: 'name',
      render: (u) => (
        <div>
          <span className="font-semibold text-navy-950 block">{u.name}</span>
          <span className="text-xs text-slate-500">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      key: 'role',
      render: (u) => <Badge status={u.role} size="sm" />,
    },
    {
      header: 'Department',
      key: 'department',
      render: (u) => <span className="text-xs text-slate-700">{u.department || '—'}</span>,
    },
    {
      header: 'Jurisdiction',
      key: 'jurisdiction',
      render: (u) => (
        <div className="text-xs">
          <span className="text-slate-800 font-medium">{u.district || '—'}</span>
          {u.tehsil && <span className="text-slate-500 block text-[11px]">{u.tehsil}</span>}
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (u) => <Badge status={u.status || 'ACTIVE'} size="sm" />,
    },
    {
      header: 'Created Date',
      key: 'createdAt',
      render: (u) => (
        <span className="text-xs text-slate-500">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (u) => {
        const isActive = (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              icon={Eye}
              onClick={() => handleViewUser(u)}
              title="View User Details"
            >
              View
            </Button>
            <Button
              variant={isActive ? 'danger' : 'success'}
              size="xs"
              icon={isActive ? UserX : UserCheck}
              onClick={() => handleToggleStatus(u)}
              title={isActive ? 'Deactivate User' : 'Activate User'}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-950">
            User Management
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => setIsCreateOpen(true)}
          >
            Add New User
          </Button>
        </div>
      </div>

      {error && (
        <ErrorAlert
          title="Error Loading User Accounts"
          message={error}
          onRetry={fetchUsers}
        />
      )}

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search user name or official email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>

            {/* Role Filter */}
            <div>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="All Roles"
                options={ROLES}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="All Account Statuses"
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500 font-medium">
              Registered users: <strong className="text-slate-800">{totalCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              {(search || roleFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Clear Filters
                </button>
              )}
              <Button type="submit" size="xs" variant="primary">
                Apply Filters
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="users"
              title="No users found"
              message={
                search || roleFilter || statusFilter
                  ? 'No user accounts match the search or filter criteria.'
                  : 'No users registered in the database yet.'
              }
              action={
                <Button variant="primary" size="xs" icon={UserPlus} onClick={() => setIsCreateOpen(true)}>
                  Create First User
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={users}
              keyExtractor={(u, i) => u._id || u.id || i}
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !actionLoading && setIsCreateOpen(false)}
        title="Register New Portal User"
        subtitle="Provision access for operators, verification officers, or administrators."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={actionLoading}
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={handleCreateUser}
            >
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              required
            />
            <Input
              label="Official Email Address"
              type="email"
              placeholder="e.g. ramesh.k@gov.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={formErrors.password}
              helperText="Never display or log plaintext passwords."
              required
            />
            <Select
              label="Assigned Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={ROLES}
              error={formErrors.role}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Department"
              placeholder="e.g. Revenue Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Input
              label="District"
              placeholder="e.g. Jaipur"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
            <Input
              label="Tehsil"
              placeholder="e.g. Amber"
              value={formData.tehsil}
              onChange={(e) => setFormData({ ...formData, tehsil: e.target.value })}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            <p>
              <strong>Security Protocol:</strong> Passwords are sent over encrypted TLS and hashed securely by the backend. Passwords or password hashes are never stored in browser state.
            </p>
          </div>
        </form>
      </Modal>

      {/* View User Modal (Never exposes passwords or password hashes) */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="User Account Details"
        subtitle={`User ID: ${selectedUser?._id || selectedUser?.id || '—'}`}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setIsViewOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white font-bold text-sm flex items-center justify-center">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-navy-950">{selectedUser.name}</h4>
                  <p className="text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={selectedUser.role} />
                <Badge status={selectedUser.status || 'ACTIVE'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Department</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedUser.department || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">District Jurisdiction</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedUser.district || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tehsil Jurisdiction</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedUser.tehsil || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Registration Date</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Password hashes are sealed and protected under system encryption.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
