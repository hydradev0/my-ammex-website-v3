/**
 * Analytics Scheduler Service
 * 
 * Automatically refreshes website analytics materialized views on a schedule.
 * 
 * Usage:
 * 1. Install: npm install node-cron
 * 2. Import in server.js: const analyticsScheduler = require('./services/analyticsScheduler');
 * 3. Start after DB connection: analyticsScheduler.start();
 */

const cron = require('node-cron');
const { getSequelize } = require('../config/db');

class AnalyticsScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRunTime = null;
    this.scheduledTasks = [];
  }

  /**
   * Start the analytics refresh scheduler
   * @param {string} schedule - Cron schedule (default: every hour)
   */
  start(schedule = '0 * * * *') {
    if (this.isRunning) {
      console.log('⚠️  Analytics scheduler is already running');
      return;
    }

    // Validate cron schedule
    if (!cron.validate(schedule)) {
      console.error('❌ Invalid cron schedule:', schedule);
      return;
    }

    // Schedule the refresh task
    const task = cron.schedule(schedule, async () => {
      await this.refreshAnalytics();
    });

    this.scheduledTasks.push(task);
    this.isRunning = true;

    console.log('📅 Analytics refresh scheduler started');
    console.log(`⏰ Schedule: ${schedule} (${this.describeCronSchedule(schedule)})`);
    console.log('🔄 Next run:', this.getNextRunTime(schedule));
  }

  /**
   * Refresh website analytics materialized views
   */
  async refreshAnalytics() {
    const startTime = Date.now();
    
    try {
      console.log('\n⏰ Starting scheduled website analytics refresh...');
      console.log('📅 Time:', new Date().toISOString());

      const sequelize = getSequelize();
      
      if (!sequelize) {
        console.error('❌ Database not connected. Skipping refresh.');
        return;
      }

      // Call the PostgreSQL function to refresh all materialized views
      await sequelize.query('SELECT refresh_website_analytics()');

      const duration = Date.now() - startTime;
      this.lastRunTime = new Date();

      console.log('✅ Website analytics refreshed successfully');
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log('🔄 Next run:', this.getNextRunTime());

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Failed to refresh website analytics');
      console.error('⏱️  Duration:', duration, 'ms');
      console.error('📝 Error:', error.message);
      
      // Optionally, send alert/notification here
      // await this.sendAlert(error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.scheduledTasks.forEach(task => task.stop());
    this.scheduledTasks = [];
    this.isRunning = false;
    console.log('🛑 Analytics scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.getNextRunTime(),
      tasksCount: this.scheduledTasks.length
    };
  }

  /**
   * Get next run time (approximate)
   * @param {string} schedule - Cron schedule
   */
  getNextRunTime(schedule = '0 * * * *') {
    // This is approximate - for exact timing, use a cron parser library
    const now = new Date();
    const next = new Date(now);
    
    // Simple calculation for common schedules
    if (schedule === '0 * * * *') {
      // Every hour
      next.setHours(now.getHours() + 1, 0, 0, 0);
    } else if (schedule === '*/30 * * * *') {
      // Every 30 minutes
      const minutes = now.getMinutes();
      if (minutes < 30) {
        next.setMinutes(30, 0, 0);
      } else {
        next.setHours(now.getHours() + 1, 0, 0, 0);
      }
    } else if (schedule === '*/15 * * * *') {
      // Every 15 minutes
      const minutes = Math.ceil(now.getMinutes() / 15) * 15;
      next.setMinutes(minutes, 0, 0);
    } else if (schedule === '0 */4 * * *') {
      // Every 4 hours
      next.setHours(Math.ceil(now.getHours() / 4) * 4, 0, 0, 0);
    } else if (schedule === '0 2 * * *') {
      // Daily at 2 AM
      next.setDate(now.getDate() + 1);
      next.setHours(2, 0, 0, 0);
    }
    
    return next.toISOString();
  }

  /**
   * Describe cron schedule in human-readable format
   * @param {string} schedule - Cron schedule
   */
  describeCronSchedule(schedule) {
    const descriptions = {
      '0 * * * *': 'Every hour at minute 0',
      '*/30 * * * *': 'Every 30 minutes',
      '*/15 * * * *': 'Every 15 minutes',
      '0 */4 * * *': 'Every 4 hours',
      '0 2 * * *': 'Every day at 2:00 AM',
      '0 0 * * 0': 'Every Sunday at midnight',
      '0 0 * * *': 'Every day at midnight'
    };
    
    return descriptions[schedule] || schedule;
  }

  /**
   * Send alert on failure (optional - implement based on your needs)
   * @param {Error} error - The error that occurred
   */
  async sendAlert(error) {
    // TODO: Implement your alerting logic here
    // Examples:
    // - Send email
    // - Post to Slack
    // - Log to monitoring service
    // - Send SMS
    
    console.log('🚨 Alert: Analytics refresh failed -', error.message);
  }
}

// Export singleton instance
module.exports = new AnalyticsScheduler();

/* 
 * ==============================================================================
 * USAGE EXAMPLES:
 * ==============================================================================
 * 
 * 1. In server.js (Basic):
 * 
 *    const analyticsScheduler = require('./services/analyticsScheduler');
 *    
 *    // After database connection
 *    analyticsScheduler.start(); // Every hour by default
 * 
 * 
 * 2. Custom Schedule:
 * 
 *    // Every 30 minutes
 *    analyticsScheduler.start('*//*30 * * * *');
 *    
 *    // Every 4 hours
 *    analyticsScheduler.start('0 *//*4 * * *');
 *    
 *    // Daily at 2 AM
 *    analyticsScheduler.start('0 2 * * *');
 * 
 * 
 * 3. Check Status:
 * 
 *    const status = analyticsScheduler.getStatus();
 *    console.log('Scheduler status:', status);
 * 
 * 
 * 4. Manual Refresh:
 * 
 *    await analyticsScheduler.refreshAnalytics();
 * 
 * 
 * 5. Stop Scheduler:
 * 
 *    analyticsScheduler.stop();
 * 
 * ==============================================================================
 * CRON SCHEDULE FORMAT:
 * ==============================================================================
 * 
 * * * * * *
 * │ │ │ │ │
 * │ │ │ │ └─── day of week (0 - 6) (Sunday to Saturday)
 * │ │ │ └───── month (1 - 12)
 * │ │ └─────── day of month (1 - 31)
 * │ └───────── hour (0 - 23)
 * └─────────── minute (0 - 59)
 * 
 * Common Schedules:
 * - '*//*15 * * * *'  - Every 15 minutes
 * - '*//*30 * * * *'  - Every 30 minutes
 * - '0 * * * *'     - Every hour
 * - '0 *//*2 * * *'  - Every 2 hours
 * - '0 *//*4 * * *'  - Every 4 hours
 * - '0 0 * * *'     - Every day at midnight
 * - '0 2 * * *'     - Every day at 2 AM
 * - '0 0 * * 0'     - Every Sunday at midnight
 * - '0 0 1 * *'     - First day of every month
 * 
 * ==============================================================================
 */

