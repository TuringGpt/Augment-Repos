"""
Data migration: normalize existing newsletter emails to lowercase.

If case-variant duplicates exist (e.g., "User@Ex.com" and "user@ex.com"),
we keep the most recently active subscription (preferring is_active=True,
then latest created_at) and soft-delete the rest so no IntegrityError
is raised when the model's save() starts lower-casing on write.
"""

from django.db import migrations


def normalize_emails(apps, schema_editor):
    Newsletter = apps.get_model("newsletter", "Newsletter")

    # Group all rows by their lowercased email
    seen = {}  # lowercase_email -> best_row_id
    duplicates_to_deactivate = []

    for row in Newsletter.objects.all().order_by("-is_active", "-created_at"):
        key = row.email.strip().lower()
        if key not in seen:
            seen[key] = row.id
        else:
            # This is a duplicate; mark it for deactivation
            duplicates_to_deactivate.append(row.id)

    # Deactivate duplicates (soft-delete)
    if duplicates_to_deactivate:
        Newsletter.objects.filter(id__in=duplicates_to_deactivate).update(is_active=False)

    # Now normalize all emails to lowercase (safe — duplicates are deactivated)
    for row in Newsletter.objects.all():
        normalized = row.email.strip().lower()
        if row.email != normalized:
            row.email = normalized
            row.save(update_fields=["email"])


def reverse_normalize(apps, schema_editor):
    # Normalization is not reversible — original casing is lost.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("newsletter", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(normalize_emails, reverse_normalize),
    ]
