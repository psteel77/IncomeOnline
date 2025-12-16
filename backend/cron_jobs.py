#!/usr/bin/env python3
"""
Cron job script for processing subscription expirations.
This script should be run daily via cron or a scheduler.
"""
import requests
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

API_URL = "http://localhost:8001/api/subscription/process-expirations"

def process_expirations():
    """Call the API endpoint to process subscription expirations"""
    try:
        logger.info(f"Starting subscription expiration processing at {datetime.now()}")
        
        response = requests.post(API_URL, timeout=60)
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

if __name__ == "__main__":
    process_expirations()
