from django.db import migrations


class Migration(migrations.Migration):
    """No-op: 0037_remove_storesettings_affiliate_benefits_and_more already
    added AffiliateCommission.level in the same migration that removed the
    StoreSettings affiliate_* fields — this migration originally re-added the
    identical field, which fails with "column already exists" on any
    from-scratch migrate (fresh test DB, new dev machine, fresh deploy).
    Kept as a no-op rather than deleted so already-applied django_migrations
    rows for '0038_affiliatecommission_level' on existing databases stay valid."""

    dependencies = [
        ('ecommerce', '0037_remove_storesettings_affiliate_benefits_and_more'),
    ]

    operations = []
