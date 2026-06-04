from django.db import migrations, models
import django.utils.translation


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="City",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=128, unique=True, verbose_name=django.utils.translation.gettext_lazy("City"))),
                ("is_active", models.BooleanField(default=True, verbose_name=django.utils.translation.gettext_lazy("Is active"))),
            ],
            options={
                "verbose_name": "City",
                "verbose_name_plural": "Cities",
                "ordering": ["name"],
            },
        ),
    ]
