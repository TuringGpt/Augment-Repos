# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_searchquery'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='product',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['name'], name='prod_name_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['created_at'], name='prod_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['price'], name='prod_price_idx'),
        ),
    ]
