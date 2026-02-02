# Script rapide pour réinitialiser la base sur un nouveau PC
python manage.py migrate
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'ton_password_ici')" | python manage.py shell