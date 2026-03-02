import { apiClient } from '@/lib/api';

class SalaryService {
  // ============ SHIFT CONFIG ============
  async getShiftConfig() {
    return await apiClient.get('/salary/shift-config');
  }

  async updateShiftConfig(data) {
    return await apiClient.put('/salary/shift-config', data);
  }

  // ============ STAFF SALARY ============
  async getAllStaffSalaries(params = {}) {
    const queryParams = [];
    if (params.department) queryParams.push(`department=${encodeURIComponent(params.department)}`);
    if (params.staffType) queryParams.push(`staffType=${encodeURIComponent(params.staffType)}`);
    const url = `/salary/staff-salaries${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return await apiClient.get(url);
  }

  async updateStaffSalary(staffId, data) {
    return await apiClient.put(`/salary/staff/${encodeURIComponent(staffId)}/salary`, data);
  }

  async getStaffSalaryHistory(staffId) {
    return await apiClient.get(`/salary/staff/${encodeURIComponent(staffId)}/salary-history`);
  }

  // ============ ADMIN EDIT ATTENDANCE TIME ============
  async adminEditAttendanceTime(staffId, data) {
    return await apiClient.put(`/salary/attendance/${encodeURIComponent(staffId)}/edit-time`, data);
  }

  // ============ HOLIDAY QUOTA ============
  async getSpecialHolidayQuotas(params = {}) {
    const queryParams = [];
    if (params.year) queryParams.push(`year=${encodeURIComponent(params.year)}`);
    if (params.month) queryParams.push(`month=${encodeURIComponent(params.month)}`);
    const url = `/salary/holiday-quotas${queryParams.length ? '?' + queryParams.join('&') : ''}`;
    return await apiClient.get(url);
  }

  async createSpecialHolidayQuota(data) {
    return await apiClient.post('/salary/holiday-quota', data);
  }

  async updateSpecialHolidayQuota(id, data) {
    return await apiClient.put(`/salary/holiday-quota/${encodeURIComponent(id)}`, data);
  }

  async deleteSpecialHolidayQuota(id) {
    return await apiClient.delete(`/salary/holiday-quota/${encodeURIComponent(id)}`);
  }

  async allocateSpecialHoliday(quotaId, data) {
    return await apiClient.post(`/salary/holiday-quota/${encodeURIComponent(quotaId)}/allocate`, data);
  }

  async getQuotaAllocations(quotaId) {
    return await apiClient.get(`/salary/holiday-quota/${encodeURIComponent(quotaId)}/allocations`);
  }

  async removeHolidayAllocation(id) {
    return await apiClient.delete(`/salary/holiday-allocation/${encodeURIComponent(id)}`);
  }

  // ============ PAYSLIP ============
  async generatePayslip(data) {
    return await apiClient.post('/salary/payslip/generate', data);
  }

  async generateBulkPayslips(data) {
    return await apiClient.post('/salary/payslip/generate-bulk', data);
  }

  async finalizePayslip(id) {
    return await apiClient.put(`/salary/payslip/${encodeURIComponent(id)}/finalize`);
  }

  async getPayslip(id) {
    return await apiClient.get(`/salary/payslip/${encodeURIComponent(id)}`);
  }

  async getStaffPayslips(staffId) {
    return await apiClient.get(`/salary/staff/${encodeURIComponent(staffId)}/payslips`);
  }

  async getMonthlyPayslips(month, year) {
    return await apiClient.get(`/salary/payslips/monthly?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
  }

  // ============ STAFF SELF-SERVICE ============
  async getMyPayslips() {
    return await apiClient.get('/salary/my/payslips');
  }

  async getMyPayslipDetail(id) {
    return await apiClient.get(`/salary/my/payslip/${encodeURIComponent(id)}`);
  }

  async getMySalarySummary() {
    return await apiClient.get('/salary/my/salary-summary');
  }

  async getMyCalendarAttendance(month, year) {
    return await apiClient.get(`/salary/my/calendar-attendance?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
  }

  async getPayslipPdfUrl(id) {
    return await apiClient.get(`/salary/my/payslip/${encodeURIComponent(id)}/pdf`);
  }
}

export default new SalaryService();
