
def generate_dummy_products(count=50, delete_existing=True, dry_run=True):
    from products.factory import ProductFactory
    from accounts.models import User
    from products.models import Product

    if dry_run:
        print(f"DRY RUN: Would generate {count} products")
        return

    # Create merchant user if it doesn't exist
    merchant_user, created = User.objects.get_or_create(
        email="merchant@demo.com",
        defaults={
            'password': 'testpass123',
            'is_active': True,
            'role': User.Role.MERCHANT
        }
    )

    if delete_existing:
        deleted_count = Product.objects.filter(created_by=merchant_user).delete()[0]
        print(f"Deleted {deleted_count} existing products")

    # Generate products
    for i in range(count):
        product = ProductFactory(created_by=merchant_user)
        print(f"Created product {i+1}/{count}: {product.name}")

    print(f"Successfully generated {count} products")


if __name__ == "__main__":
    # setup django environment
    import os
    import django
    import argparse

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    os.environ["SECRET_KEY"] = "test-secret-key"
    django.setup()

    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Generate dummy products for testing')
    parser.add_argument('--count', type=int, default=100, help='Number of products to generate (default: 100)')
    parser.add_argument('--delete-existing', action='store_true', default=True, help='Delete existing products (default: True)')
    parser.add_argument('--no-delete', dest='delete_existing', action='store_false', help='Keep existing products')
    parser.add_argument('--dry-run', action='store_true', help='Preview what would be done without making changes')

    args = parser.parse_args()

    generate_dummy_products(
        count=args.count,
        delete_existing=args.delete_existing,
        dry_run=args.dry_run
    )
