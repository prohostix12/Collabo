from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0013_trusted_partners'),
    ]

    operations = [
        migrations.AddField(
            model_name='productreview',
            name='custom_price',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Influencer's custom price for buyers using this link. Overrides the product's discount price.",
                max_digits=12,
                null=True,
            ),
        ),
    ]
