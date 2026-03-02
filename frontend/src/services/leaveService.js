import { apiClient } from '@/lib/api';

class LeaveService {
  // ============ STAFF SELF-SERVICE ============
  async submitLeaveRequest(data) {
    return await apiClient.post('/leave/request', data);
  }

  async getMyLeaveRequests(params = {}) {
    const queryParams = [];
    if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
    if (params.year) queryParams.push(`year=${encodeURIComponent(params.year)}`);
    const url = `/leave/my-requests${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return await apiClient.get(url);
  }

  async cancelLeaveRequest(id) {
    return await apiClient.delete(`/leave/request/${encodeURIComponent(id)}`);
  }

  async submitLateApproval(data) {
    return await apiClient.post('/leave/late-approval', data);
  }

  async getMyLateApprovals(params = {}) {
    const queryParams = [];
    if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
    const url = `/leave/my-late-approvals${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return await apiClient.get(url);
  }

  // ============ ADMIN ============
  async getAllLeaveRequests(params = {}) {
    const queryParams = [];
    if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    if (params.month) queryParams.push(`month=${encodeURIComponent(params.month)}`);
    if (params.year) queryParams.push(`year=${encodeURIComponent(params.year)}`);
    const url = `/leave/requests${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return await apiClient.get(url);
  }

  async reviewLeaveRequest(id, data) {
    return await apiClient.put(`/leave/request/${encodeURIComponent(id)}/review`, data);
  }

  async getAllLateApprovals(params = {}) {
    const queryParams = [];
    if (params.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
    if (params.staffId) queryParams.push(`staffId=${encodeURIComponent(params.staffId)}`);
    const url = `/leave/late-approvals${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return await apiClient.get(url);
  }

  async reviewLateApproval(id, data) {
    return await apiClient.put(`/leave/late-approval/${encodeURIComponent(id)}/review`, data);
  }

  async getPendingCount() {
    return await apiClient.get('/leave/pending-count');
  }
}

export default new LeaveService();
