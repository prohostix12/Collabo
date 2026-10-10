from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0033_remove_storesettings_affiliate_benefits_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='delivery_otp',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='delivery_otp_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
