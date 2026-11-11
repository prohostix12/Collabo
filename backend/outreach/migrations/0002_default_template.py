from django.db import migrations

BODY = """Dear Brand,

We are onboarding brands and suppliers to our online retail store - its a upcoming D2C marketplace in India now.

Our website to explore your retail store -  https://collabo.co.in/
We are interested in listing your product catalogue on our platform and exploring a direct supplier/brand partnership.

Could you please connect us with your:

- Brand partnership or B2B sales team
- Complete product catalogue with images and SKUs
- Wholesale/reseller pricing
- Dropshipping or direct fulfilment options
- Inventory and order integration options
- Shipping, return and replacement policies.

Please share the concerned person's contact number and partnership details.

**Note: Additional Brand Promotion Opportunities**

We also offer premium brand visibility opportunities through our marketplace, including homepage promotional banners and brand advertisements. These placements help increase brand awareness, enhance product visibility, attract potential customers, and drive more traffic and sales.

Thank you,
Mohammed Maaz Hussain
Ecom - Vendor Acquisition Manager
9845511956
Team - Collabo"""


def add_default(apps, schema_editor):
    T = apps.get_model('outreach', 'OutreachTemplate')
    if not T.objects.filter(name='Brand onboarding - vendor acquisition').exists():
        T.objects.create(name='Brand onboarding - vendor acquisition',
                         subject='Partnership opportunity: list {{brand_name}} on Collabo',
                         body=BODY)


def remove_default(apps, schema_editor):
    apps.get_model('outreach', 'OutreachTemplate').objects.filter(name='Brand onboarding - vendor acquisition').delete()


class Migration(migrations.Migration):
    dependencies = [('outreach', '0001_initial')]
    operations = [migrations.RunPython(add_default, remove_default)]
