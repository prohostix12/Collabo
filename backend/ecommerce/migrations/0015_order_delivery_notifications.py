from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0014_productreview_custom_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='expected_delivery_date',
            field=models.DateField(
                blank=True,
                null=True,
                help_text='Expected delivery date (auto-set on order creation)',
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='pre_delivery_notified',
            field=models.BooleanField(
                default=False,
                help_text='WhatsApp reminder sent the day before delivery',
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_day_notified',
            field=models.BooleanField(
                default=False,
                help_text='WhatsApp message sent on delivery day',
            ),
        ),
    ]
