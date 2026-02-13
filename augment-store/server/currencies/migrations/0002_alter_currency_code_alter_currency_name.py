# Generated manually on 2026-02-13
# Includes data cleanup for duplicates before applying uniqueness constraints
# Ensures dependent rows (User.preferred_currency) are re-pointed to canonical records

from django.db import migrations, models

def repoint_and_cleanup_duplicates(apps, schema_editor):
    Currency = apps.get_model('currencies', 'Currency')
    User = apps.get_model('accounts', 'User')

    # 1. Deduplicate by 'code' (normalize to upper + strip)
    seen_codes = {}
    for currency in Currency.objects.all():
        normalized_code = currency.code.upper().strip()
        if normalized_code in seen_codes:
            canonical = seen_codes[normalized_code]
            # Re-point users to canonical before deleting duplicate
            User.objects.filter(preferred_currency=currency).update(preferred_currency=canonical)
            currency.delete()
        else:
            if currency.code != normalized_code:
                currency.code = normalized_code
                currency.save()
            seen_codes[normalized_code] = currency

    # 2. Deduplicate by 'name' (normalize to strip)
    seen_names = {}
    for currency in Currency.objects.all():
        normalized_name = currency.name.strip()
        if normalized_name in seen_names:
            canonical = seen_names[normalized_name]
            # Re-point users to canonical before deleting duplicate
            User.objects.filter(preferred_currency=currency).update(preferred_currency=canonical)
            currency.delete()
        else:
            if currency.name != normalized_name:
                currency.name = normalized_name
                currency.save()
            seen_names[normalized_name] = currency

class Migration(migrations.Migration):

    dependencies = [
        ('currencies', '0001_initial'),
        ('accounts', '0005_user_preferred_currency'),
    ]

    operations = [
        migrations.RunPython(repoint_and_cleanup_duplicates, reverse_code=migrations.RunPython.noop),
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
