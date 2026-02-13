# Generated manually on 2026-02-13

from django.db import migrations, models

def repoint_and_cleanup_duplicates(apps, schema_editor):
    Currency = apps.get_model('currencies', 'Currency')
    User = apps.get_model('accounts', 'User')

    def deduplicate_field(field_name, tracking_func, save_normalization_func):
        seen_items = {}
        # Order by is_deleted (False first) then created_at (oldest first)
        queryset = Currency.objects.all().order_by('is_deleted', 'created_at')
        
        for currency in queryset:
            val = getattr(currency, field_name)
            if val is None:
                # Missing values are unusable for unique fields
                User.objects.filter(preferred_currency=currency).update(preferred_currency=None)
                currency.delete()
                continue
            
            tracking_key = tracking_func(val)
            # If tracking key is empty, it's invalid for a unique=True constraint.
            if not tracking_key:
                User.objects.filter(preferred_currency=currency).update(preferred_currency=None)
                currency.delete()
                continue
                
            if tracking_key in seen_items:
                canonical = seen_items[tracking_key]
                User.objects.filter(preferred_currency=currency).update(preferred_currency=canonical)
                currency.delete()
            else:
                # Apply the canonical normalization (e.g. strip or upper)
                new_val = save_normalization_func(val)
                if val != new_val:
                    setattr(currency, field_name, new_val)
                    currency.save()
                seen_items[tracking_key] = currency

    # 1. Deduplicate by 'code': Upper + Strip for both tracking and saving
    deduplicate_field(
        'code', 
        lambda x: x.upper().strip(), 
        lambda x: x.upper().strip()
    )

    # 2. Deduplicate by 'name': Strip + Lower for tracking, but only Strip for saving
    # This preserves the original case of the oldest active record while preventing case variants
    deduplicate_field(
        'name', 
        lambda x: x.strip().lower(), 
        lambda x: x.strip()
    )

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
