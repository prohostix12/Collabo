from django.db import migrations
from django.utils.text import slugify


def backfill_slugs(apps, schema_editor):
    SellerProfile = apps.get_model('accounts', 'SellerProfile')
    used = set(SellerProfile.objects.exclude(store_slug__isnull=True).values_list('store_slug', flat=True))
    for profile in SellerProfile.objects.filter(store_slug__isnull=True):
        base = slugify(profile.store_name) or f'store-{profile.pk}'
        slug = base
        n = 1
        while slug in used:
            n += 1
            slug = f'{base}-{n}'
        used.add(slug)
        profile.store_slug = slug
        profile.save(update_fields=['store_slug'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0025_sellerprofile_featured_product_ids_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_slugs, noop),
    ]
