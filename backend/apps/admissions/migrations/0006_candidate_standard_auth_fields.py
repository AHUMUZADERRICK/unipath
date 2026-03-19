from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0005_coursecutoffhistory"),
    ]

    operations = [
        migrations.AddField(
            model_name="candidate",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="candidate",
            name="first_name",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="candidate",
            name="last_name",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="candidate",
            name="password_hash",
            field=models.CharField(blank=True, max_length=128),
        ),
    ]
