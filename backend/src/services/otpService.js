// src/services/otpService.js
const crypto = require('crypto');
const prisma = require('../utils/prisma');

class OTPService {
  constructor() {
    // Rate limiter for OTP requests (keeping in memory for performance)
    this.rateLimiter = new Map();
    
    // Verify Prisma client is properly initialized
    if (!prisma) {
      console.error('❌ Prisma client is not initialized');
      throw new Error('Database connection not available');
    } 
    
    if (!prisma.oTP) {
      console.error('❌ OTP model not found in Prisma client');
      console.log('Available models:', Object.keys(prisma).filter(key => typeof prisma[key] === 'object' && prisma[key].create));
      throw new Error('OTP model not available in database schema');
    }
    
    console.log('✅ OTP Service initialized successfully');
    
    // Clean up expired OTPs every 10 minutes
    setInterval(() => this.cleanupExpiredOTPs(), 10 * 60 * 1000);
    
    // Clean up rate limiter every hour
    setInterval(() => this.cleanupRateLimiter(), 60 * 60 * 1000);
  }

  /**
   * Generate OTP and store in database
   * @param {string} identifier - Email or phone number
   * @param {string} purpose - Purpose of OTP (default: 'password_reset')
   * @param {number} expiryMinutes - OTP expiry time in minutes (default: 10)
   * @param {string} ipAddress - IP address for security tracking
   * @param {string} userAgent - User agent for security tracking
   * @param {number} otpLength - Length of OTP (4 or 6 digits, default: 6)
   * @returns {Object} Generated OTP data
   */
  async generateAndStoreOTP(identifier, purpose = 'password_reset', expiryMinutes = 10, ipAddress = null, userAgent = null, otpLength = 6) {
    try {
      // Generate OTP based on specified length
      let otp;
      if (otpLength === 4) {
        // Generate 4-digit OTP for patient registration
        otp = crypto.randomInt(1000, 9999).toString();
      } else {
        // Generate 6-digit OTP for other purposes
        otp = crypto.randomInt(100000, 999999).toString();
      }
      
      const expiresAt = new Date(Date.now() + (expiryMinutes * 60 * 1000));

      // Invalidate any existing OTPs for this identifier and purpose
      await this.invalidateExistingOTPs(identifier, purpose);

      // Store OTP in database
      const otpRecord = await prisma.oTP.create({
        data: {
          identifier: identifier.toLowerCase(),
          otp: otp,
          purpose: purpose,
          expiresAt: expiresAt,
          attempts: 0,
          maxAttempts: 3,
          isUsed: false,
          ipAddress: ipAddress,
          userAgent: userAgent
        }
      });

      console.log(`${otpLength}-digit OTP generated for ${identifier} (Purpose: ${purpose})`);
      
      return {
        id: otpRecord.id,
        otp: otp,
        expiresAt: expiresAt,
        purpose: purpose,
        length: otpLength
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new Error('Failed to generate OTP');
    }
  }

  /**
   * Generate 4-digit OTP specifically for patient registration
   * @param {string} identifier - Email or phone number
   * @param {number} expiryMinutes - OTP expiry time in minutes (default: 10)
   * @param {string} ipAddress - IP address for security tracking
   * @param {string} userAgent - User agent for security tracking
   * @returns {Object} Generated OTP data
   */
  async generatePatientRegistrationOTP(identifier, expiryMinutes = 10, ipAddress = null, userAgent = null) {
    return await this.generateAndStoreOTP(
      identifier,
      'patient_registration',
      expiryMinutes,
      ipAddress,
      userAgent,
      4 // 4-digit OTP for patient registration
    );
  }

  /**
   * Generate daily attendance OTP - one per day for all staff
   * @returns {Object} Generated daily OTP data
   */
  async generateDailyAttendanceOTP() {
    try {
      // Use current date as identifier (YYYY-MM-DD format)
      const today = new Date();
      const dateIdentifier = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Set expiry to end of current day (23:59:59)
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Check if daily OTP already exists
      const existingOTP = await prisma.oTP.findFirst({
        where: {
          identifier: dateIdentifier,
          purpose: 'daily_attendance',
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      // If OTP exists and is still valid, return it
      if (existingOTP) {
        console.log(`Daily attendance OTP already exists for ${dateIdentifier}`);
        return {
          id: existingOTP.id,
          otp: existingOTP.otp,
          expiresAt: existingOTP.expiresAt,
          purpose: existingOTP.purpose,
          date: dateIdentifier,
          isNew: false
        };
      }

      // Generate new 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      
      // Create OTP record
      const otpRecord = await prisma.oTP.create({
        data: {
          identifier: dateIdentifier,
          otp: otp,
          purpose: 'daily_attendance',
          expiresAt: endOfDay,
          attempts: 0,
          maxAttempts: 999, // High limit since this is shared by all staff
          isUsed: false,
          ipAddress: null, // Not applicable for daily OTP
          userAgent: null  // Not applicable for daily OTP
        }
      });

      console.log(`Daily attendance OTP generated for ${dateIdentifier}: ${otp}`);
      
      return {
        id: otpRecord.id,
        otp: otp,
        expiresAt: endOfDay,
        purpose: 'daily_attendance',
        date: dateIdentifier,
        isNew: true
      };
    } catch (error) {
      console.error('Error generating daily attendance OTP:', error);
      throw new Error('Failed to generate daily attendance OTP');
    }
  }

  /**
   * Verify OTP from database
   * @param {string} identifier - Email or phone number
   * @param {string} providedOTP - OTP provided by user
   * @param {string} purpose - Purpose of OTP verification
   * @returns {Object} Verification result
   */
  async verifyOTP(identifier, providedOTP, purpose = 'password_reset') {
    try {
      // Find active OTP for this identifier and purpose
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          identifier: identifier.toLowerCase(),
          purpose: purpose,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!otpRecord) {
        throw new Error('OTP not found or expired');
      }

      // Check if maximum attempts exceeded
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        // Mark as used to prevent further attempts
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { isUsed: true }
        });
        throw new Error('Maximum OTP attempts exceeded');
      }

      // Increment attempt count
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });

      // Verify OTP
      if (otpRecord.otp !== providedOTP.toString()) {
        throw new Error('Invalid OTP');
      }

      // Mark OTP as used (except for daily attendance OTPs which are reusable)
      if (purpose !== 'daily_attendance') {
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { 
            isUsed: true,
            updatedAt: new Date()
          }
        });
      } else {
        // For daily attendance OTPs, just update the timestamp but keep it usable
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { 
            updatedAt: new Date()
          }
        });
      }

      console.log(`OTP verified successfully for ${identifier} (Purpose: ${purpose})`);
      
      return {
        verified: true,
        identifier: identifier,
        purpose: purpose,
        otpId: otpRecord.id
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Invalidate existing OTPs for identifier and purpose
   * @param {string} identifier - Email or phone number
   * @param {string} purpose - Purpose of OTP
   */
  async invalidateExistingOTPs(identifier, purpose) {
    try {
      await prisma.oTP.updateMany({
        where: {
          identifier: identifier.toLowerCase(),
          purpose: purpose,
          isUsed: false
        },
        data: {
          isUsed: true,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error invalidating existing OTPs:', error);
      // Don't throw error as this is a cleanup operation
    }
  }

  /**
   * Check rate limiting for OTP requests
   * @param {string} identifier - Email or phone number
   * @param {string} purpose - Purpose of OTP
   * @param {number} windowMinutes - Time window in minutes (default: 15)
   * @param {number} maxRequests - Maximum requests in time window (default: 5)
   * @returns {Object} Rate limit status
   */
  async checkRateLimit(identifier, purpose = 'password_reset', windowMinutes = 15, maxRequests = 5) {
    try {
      const windowStart = new Date(Date.now() - (windowMinutes * 60 * 1000));
      
      // Count OTP requests in the time window from database
      const recentCount = await prisma.oTP.count({
        where: {
          identifier: identifier.toLowerCase(),
          purpose: purpose,
          createdAt: {
            gte: windowStart
          }
        }
      });

      const isLimited = recentCount >= maxRequests;
      const remainingRequests = Math.max(0, maxRequests - recentCount);
      
      if (isLimited) {
        // Find the oldest request in window to calculate reset time
        const oldestRequest = await prisma.oTP.findFirst({
          where: {
            identifier: identifier.toLowerCase(),
            purpose: purpose,
            createdAt: {
              gte: windowStart
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
        
        const resetTime = oldestRequest 
          ? new Date(oldestRequest.createdAt.getTime() + (windowMinutes * 60 * 1000))
          : new Date(Date.now() + (windowMinutes * 60 * 1000));
        
        return {
          isLimited: true,
          remainingRequests: 0,
          resetTime: resetTime,
          message: `Too many OTP requests. Try again after ${resetTime.toLocaleTimeString()}`
        };
      }

      return {
        isLimited: false,
        remainingRequests: remainingRequests,
        resetTime: null,
        message: 'Rate limit OK'
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow the request to proceed
      return {
        isLimited: false,
        remainingRequests: maxRequests,
        resetTime: null,
        message: 'Rate limit check failed, allowing request'
      };
    }
  }

  /**
   * Get OTP status for debugging
   * @param {string} identifier - Email or phone number
   * @param {string} purpose - Purpose of OTP
   * @returns {Object} OTP status
   */
  async getOTPStatus(identifier, purpose = 'password_reset') {
    try {
      const otpRecords = await prisma.oTP.findMany({
        where: {
          identifier: identifier.toLowerCase(),
          purpose: purpose
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        select: {
          id: true,
          purpose: true,
          expiresAt: true,
          attempts: true,
          maxAttempts: true,
          isUsed: true,
          createdAt: true,
          // Don't select the actual OTP for security
        }
      });

      return {
        identifier: identifier,
        purpose: purpose,
        totalRecords: otpRecords.length,
        records: otpRecords,
        hasActiveOTP: otpRecords.some(record => 
          !record.isUsed && record.expiresAt > new Date()
        )
      };
    } catch (error) {
      console.error('Error getting OTP status:', error);
      throw new Error('Failed to get OTP status');
    }
  }

  /**
   * Clean up expired OTPs from database
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await prisma.oTP.deleteMany({
        where: {
          OR: [
            {
              expiresAt: {
                lt: new Date()
              }
            },
            {
              isUsed: true,
              createdAt: {
                lt: new Date(Date.now() - (24 * 60 * 60 * 1000)) // Delete used OTPs older than 24 hours
              }
            }
          ]
        }
      });

      if (result.count > 0) {
        console.log(`Cleaned up ${result.count} expired/old OTP records`);
      }
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Clean up old rate limiter entries
   */
  cleanupRateLimiter() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    for (const [key, timestamps] of this.rateLimiter.entries()) {
      const recentTimestamps = timestamps.filter(timestamp => timestamp > oneHourAgo);
      if (recentTimestamps.length === 0) {
        this.rateLimiter.delete(key);
      } else {
        this.rateLimiter.set(key, recentTimestamps);
      }
    }
  }

  /**
   * Get comprehensive OTP statistics
   * @returns {Object} OTP statistics
   */
  async getOTPStatistics() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const lastHour = new Date(now.getTime() - (60 * 60 * 1000));

      const [
        totalOTPs,
        activeOTPs,
        expiredOTPs,
        usedOTPs,
        last24HourOTPs,
        lastHourOTPs
      ] = await Promise.all([
        prisma.oTP.count(),
        prisma.oTP.count({
          where: {
            isUsed: false,
            expiresAt: { gt: now }
          }
        }),
        prisma.oTP.count({
          where: {
            expiresAt: { lt: now }
          }
        }),
        prisma.oTP.count({
          where: {
            isUsed: true
          }
        }),
        prisma.oTP.count({
          where: {
            createdAt: { gte: last24Hours }
          }
        }),
        prisma.oTP.count({
          where: {
            createdAt: { gte: lastHour }
          }
        })
      ]);

      return {
        total: totalOTPs,
        active: activeOTPs,
        expired: expiredOTPs,
        used: usedOTPs,
        last24Hours: last24HourOTPs,
        lastHour: lastHourOTPs,
        timestamp: now
      };
    } catch (error) {
      console.error('Error getting OTP statistics:', error);
      throw new Error('Failed to get OTP statistics');
    }
  }
}

// Export singleton instance
const otpService = new OTPService();
module.exports = otpService;
