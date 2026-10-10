from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0012_add_shipping_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='storesettings',
            name='trusted_partners',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='List of partner/brand names shown in the scrolling marquee banner'
            ),
        ),
        migrations.AddField(
            model_name='storesettings',
            name='trusted_partners_title',
            field=models.CharField(default='Allied Global Brands', max_length=100),
        ),
    ]
