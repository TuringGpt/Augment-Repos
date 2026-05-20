from django.db import migrations, models
from django.db.models import Q

VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']

def normalize_priority(apps, schema_editor):
    Ticket = apps.get_model('ticket', 'Ticket')
    db_alias = schema_editor.connection.alias
    Ticket.objects.using(db_alias).filter(
        Q(priority__isnull=True) | Q(priority='') | ~Q(priority__in=VALID_PRIORITIES)
    ).update(priority='low')

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
