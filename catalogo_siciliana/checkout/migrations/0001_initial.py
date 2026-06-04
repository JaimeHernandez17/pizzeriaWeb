from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("basket", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PendingWompiPayment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(max_length=64, unique=True)),
                ("guest_email", models.EmailField(blank=True, max_length=254)),
                ("amount_in_cents", models.BigIntegerField()),
                ("currency", models.CharField(default="COP", max_length=8)),
                ("shipping_address", models.JSONField()),
                ("shipping_method_code", models.CharField(max_length=128)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("declined", "Declined"),
                            ("error", "Error"),
                        ],
                        default="pending",
                        max_length=32,
                    ),
                ),
                ("wompi_transaction_id", models.CharField(blank=True, max_length=128)),
                ("wompi_payment_method_type", models.CharField(blank=True, max_length=64)),
                ("wompi_status", models.CharField(blank=True, max_length=32)),
                ("order_number", models.CharField(blank=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "basket",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="basket.basket"),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PendingMercadoPagoPayment",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(max_length=64, unique=True)),
                ("guest_email", models.EmailField(blank=True, max_length=254)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="COP", max_length=8)),
                ("shipping_address", models.JSONField()),
                ("shipping_method_code", models.CharField(max_length=128)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("declined", "Declined"),
                            ("error", "Error"),
                        ],
                        default="pending",
                        max_length=32,
                    ),
                ),
                ("preference_id", models.CharField(blank=True, max_length=128)),
                ("init_point", models.URLField(blank=True)),
                ("payment_id", models.CharField(blank=True, max_length=128)),
                ("payment_status", models.CharField(blank=True, max_length=32)),
                ("payment_status_detail", models.CharField(blank=True, max_length=128)),
                ("order_number", models.CharField(blank=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "basket",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="basket.basket"),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
