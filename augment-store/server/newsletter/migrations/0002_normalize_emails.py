"""
Data migration: normalize existing newsletter emails to lowercase.

If case-variant duplicates exist (e.g., "User@Ex.com" and "user@ex.com"),
we keep the most recently active subscription (preferring is_active=True,
then latest created_at) and hard-delete the rest so no IntegrityError
is raised when the remaining rows are lowercased.
"""

from django.db import migrations


def normalize_emails(apps, schema_editor):
    Newsletter = apps.get_model("newsletter", "Newsletter")

    # Group all rows by their lowercased email.
    # Ordering: active rows first, then by newest — so the first row
    # we see for each key is the "winner" we keep.
    seen = {}  # lowercase_email -> best_row_id
    duplicates_to_delete = []

    for row in Newsletter.objects.all().order_by("-is_active", "-created_at"):
        key = row.email.strip().lower()
        if key not in seen:
            seen[key] = row.id
        else:
            duplicates_to_delete.append(row.id)

    # Hard-delete duplicates so their emails are removed from the
    # unique index before we lowercase the winners.
    if duplicates_to_delete:
        Newsletter.objects.filter(id__in=duplicates_to_delete).delete()

    # Now normalize remaining emails to lowercase (no collisions possible).
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
