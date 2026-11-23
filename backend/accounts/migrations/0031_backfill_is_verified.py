from django.db import migrations


def backfill_is_verified(apps, schema_editor):
    """Login now blocks unverified accounts. Everyone who registered before this
    feature existed had no way to verify, so grandfather them all in as verified —
    only new signups from here on start unverified and must click the email link."""
    User = apps.get_model('accounts', 'User')
    User.objects.filter(is_verified=False).update(is_verified=True)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0030_sellerprofile_address_line1_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_is_verified, noop_reverse),
    ]
