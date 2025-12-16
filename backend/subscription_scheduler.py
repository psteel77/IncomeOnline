#!/usr/bin/env python3
"""
Subscription expiration scheduler.
Runs daily to process expiring and expired subscriptions.
"""
import requests
import logging
import time
from datetime import datetime, timedelta
import schedule

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/subscription_scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

API_URL = "http://localhost:8001/api/subscription/process-expirations"

def process_expirations():
    """Call the API endpoint to process subscription expirations"""
    try:
        logger.info(f"Starting subscription expiration processing at {datetime.now()}")
        
        response = requests.post(API_URL, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get('success'):
            stats = result.get('results', {})
            logger.info(f"✅ Processing complete:")
            logger.info(f"   - Warning emails sent: {stats.get('warnings_sent', 0)}")
            logger.info(f"   - Expired users processed: {stats.get('expired_processed', 0)}")
            if stats.get('errors'):
                logger.warning(f"   - Errors: {stats.get('errors')}")
        else:
            logger.error(f"❌ Processing failed: {result.get('message')}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Failed to call API: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")

def run_scheduler():
    """Run the scheduler"""
    logger.info("🚀 Subscription scheduler started")
    logger.info("⏰ Scheduled to run daily at 08:00 UTC")
    
    # Schedule the job to run daily at 8:00 AM UTC
    schedule.every().day.at("08:00").do(process_expirations)
    
    # Also run once on startup (after a short delay to ensure backend is ready)
    logger.info("Running initial check in 30 seconds...")
    time.sleep(30)
    process_expirations()
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    run_scheduler()
