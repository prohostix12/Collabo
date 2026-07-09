from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0034_order_delivery_otp'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='delivery_otp',
        ),
        migrations.RemoveField(
            model_name='order',
            name='delivery_otp_sent_at',
        ),
    ]
