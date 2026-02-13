# Generated manually on 2026-02-13
# Includes data cleanup for duplicates before applying uniqueness constraints
# Ensures dependent rows (User.preferred_currency) are re-pointed to canonical records
# Deduplication is deterministic (prefers non-deleted, then oldest record)

from django.db import migrations, models

def repoint_and_cleanup_duplicates(apps, schema_editor):
    Currency = apps.get_model('currencies', 'Currency')
    User = apps.get_model('accounts', 'User')

    def deduplicate_field(field_name, normalize_func):
        seen_items = {}
        # Order by is_deleted (False first) then created_at (oldest first)
        # This ensures we keep an active record as canonical if possible
        queryset = Currency.objects.all().order_by('is_deleted', 'created_at')
        
        for currency in queryset:
            val = getattr(currency, field_name)
            if val is None:
                continue
            
            normalized_val = normalize_func(val)
            # Skip entries that are effectively empty after normalization
            if not normalized_val:
                continue
                
            if normalized_val in seen_items:
                canonical = seen_items[normalized_val]
                # Re-point users to canonical before deleting duplicate
                User.objects.filter(preferred_currency=currency).update(preferred_currency=canonical)
                currency.delete()
            else:
                # Normalize the canonical record itself if needed
                if val != normalized_val:
                    setattr(currency, field_name, normalized_val)
                    currency.save()
                seen_items[normalized_val] = currency

    # 1. Deduplicate by 'code' (normalize to upper + strip)
    deduplicate_field('code', lambda x: x.upper().strip())

    # 2. Deduplicate by 'name' (normalize to strip)
    deduplicate_field('name', lambda x: x.strip())

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
