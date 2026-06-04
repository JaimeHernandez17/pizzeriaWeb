from django.db import migrations


def seed_cartagena(apps, schema_editor):
    City = apps.get_model("locations", "City")
    City.objects.get_or_create(name="Cartagena", defaults={"is_active": True})


class Migration(migrations.Migration):
    dependencies = [
        ("locations", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_cartagena, migrations.RunPython.noop),
    ]
