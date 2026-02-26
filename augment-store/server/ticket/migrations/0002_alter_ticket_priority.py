from django.db import migrations, models

VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']

def normalize_priority(apps, schema_editor):
    Ticket = apps.get_model('ticket', 'Ticket')
    Ticket.objects.exclude(priority__in=VALID_PRIORITIES).update(priority='low')

class Migration(migrations.Migration):

    dependencies = [
        ('ticket', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(normalize_priority, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='ticket',
            name='priority',
            field=models.CharField(
                choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
                default='low',
                max_length=20,
            ),
        ),
    ]
