from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contact', '0003_contactmessage_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactmessage',
            name='subject',
            field=models.CharField(default='', max_length=255),
        ),
    ]
