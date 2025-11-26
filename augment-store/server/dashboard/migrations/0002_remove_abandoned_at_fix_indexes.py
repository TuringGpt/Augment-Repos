# Generated migration to remove redundant abandoned_at field and fix indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0001_initial'),
    ]

    operations = [
        # Remove old indexes BEFORE removing the column to avoid database-specific failures
        # (some databases like PostgreSQL auto-drop indexes when the column is removed,
        # causing subsequent RemoveIndex operations to fail)
        migrations.RemoveIndex(
            model_name='cartabandonment',
            name='dashboard_c_product_5a27e7_idx',
        ),
        migrations.RemoveIndex(
            model_name='cartabandonment',
            name='dashboard_c_user_id_33c887_idx',
        ),
        # Now remove the redundant abandoned_at field
        migrations.RemoveField(
            model_name='cartabandonment',
            name='abandoned_at',
        ),
        # Add new indexes using created_at
        migrations.AddIndex(
            model_name='cartabandonment',
            index=models.Index(fields=['product', '-created_at'], name='dashboard_c_product_created_idx'),
        ),
        migrations.AddIndex(
            model_name='cartabandonment',
            index=models.Index(fields=['user', '-created_at'], name='dashboard_c_user_created_idx'),
        ),
    ]

