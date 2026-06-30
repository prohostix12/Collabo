import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')

app = Celery('influencer_platform')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'periodic-follower-sync': {
        'task': 'social_media.tasks.periodic_follower_sync',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    'schedule-follower-updates': {
        'task': 'social_media.tasks.schedule_follower_updates',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    # ── Notification tasks ──────────────────────────────────────────────────
    'delivery-day-messages': {
        'task': 'ecommerce.tasks.send_delivery_day_messages',
        'schedule': crontab(hour=8, minute=0),   # 8:00 AM daily
    },
    'pre-delivery-reminders': {
        'task': 'ecommerce.tasks.send_pre_delivery_reminders',
        'schedule': crontab(hour=9, minute=0),   # 9:00 AM daily
    },
    'abandoned-cart-reminders': {
        'task': 'ecommerce.tasks.send_abandoned_cart_reminders',
        'schedule': crontab(minute=0, hour='*/2'),  # Every 2 hours
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')