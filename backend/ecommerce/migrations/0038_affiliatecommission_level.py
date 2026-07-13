from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0037_remove_storesettings_affiliate_benefits_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='affiliatecommission',
            name='level',
            field=models.PositiveSmallIntegerField(default=1, help_text='1=direct referrer, 2=upline (their recruiter)'),
        ),
    ]
