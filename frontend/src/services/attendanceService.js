import { apiClient } from '@/lib/api';

class AttendanceService {
  // Check in staff member
  async checkIn() {
    try {
      const response = await apiClient.post('/attendance/checkin');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Check out staff member
  async checkOut() {
    try {
      const response = await apiClient.post('/attendance/checkout');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get current attendance status
  async getStatus() {
    try {
      const response = await apiClient.get('/attendance/status');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get today's attendance
  async getTodayAttendance() {
    try {
      const response = await apiClient.get('/attendance/today');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Admin: Get daily attendance report
  async getDailyReport(date = null) {
    try {
      const params = date ? { date } : {};
      const response = await apiClient.get('/attendance/daily', { params });
      
      // Validate that the response is for the requested date
      if (date && response.data?.attendance) {
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Admin: Get monthly attendance report
  async getMonthlyReport(month = null, year = null) {
    try {
      const queryParams = [];
      if (month) queryParams.push(`month=${encodeURIComponent(month)}`);
      if (year) queryParams.push(`year=${encodeURIComponent(year)}`);
      
      const url = `/attendance/monthly${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Admin: Get date range attendance report for export
  async getDateRangeReport(startDate, endDate) {
    try {
      
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required in service');
      }
      
      // Manually construct URL with query parameters
      const url = `/attendance/date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Admin: Get staff attendance history
  async getStaffHistory(staffId, options = {}) {
    try {
      const { startDate, endDate, limit } = options;
      const queryParams = [];
      if (startDate) queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
      if (limit) queryParams.push(`limit=${encodeURIComponent(limit)}`);

      const url = `/attendance/staff/${encodeURIComponent(staffId)}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
      
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Admin: Get total staff count
  async getTotalStaffCount() {
    try {
      const response = await apiClient.get('/attendance/total-staff');
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new AttendanceService();