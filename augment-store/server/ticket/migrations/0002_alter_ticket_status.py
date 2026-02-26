from django.db import migrations, models

VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed']

def normalize_status(apps, schema_editor):
    Ticket = apps.get_model('ticket', 'Ticket')
    Ticket.objects.exclude(status__in=VALID_STATUSES).update(status='open')

class Migration(migrations.Migration):

    dependencies = [
        ('ticket', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(normalize_status, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='ticket',
            name='status',
            field=models.CharField(
                choices=[('open', 'Open'), ('in_progress', 'In Progress'), ('resolved', 'Resolved'), ('closed', 'Closed')],
                default='open',
                max_length=20,
            ),
        ),
    ]
