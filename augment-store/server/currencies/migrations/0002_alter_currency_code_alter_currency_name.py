# Generated manually on 2026-02-13
# Includes data cleanup for duplicates before applying uniqueness constraints

from django.db import migrations, models

def cleanup_duplicate_currencies(apps, schema_editor):
    Currency = apps.get_model('currencies', 'Currency')
    
    # Clean up by code (normalize to upper first)
    seen_codes = set()
    for currency in Currency.objects.all():
        normalized_code = currency.code.upper().strip()
        if normalized_code in seen_codes:
            currency.delete()
        else:
            if currency.code != normalized_code:
                currency.code = normalized_code
                currency.save()
            seen_codes.add(normalized_code)
            
    # Clean up by name
    seen_names = set()
    for currency in Currency.objects.all():
        normalized_name = currency.name.strip()
        if normalized_name in seen_names:
            currency.delete()
        else:
            if currency.name != normalized_name:
                currency.name = normalized_name
                currency.save()
            seen_names.add(normalized_name)

class Migration(migrations.Migration):

    dependencies = [
        ('currencies', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(cleanup_duplicate_currencies, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name='currency',
            name='code',
            field=models.CharField(max_length=255, unique=True),
        ),
        migrations.AlterField(
            model_name='currency',
            name='name',
            field=models.CharField(max_length=255, unique=True),
        ),
    ]
