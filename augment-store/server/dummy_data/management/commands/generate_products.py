import mimetypes
import random
import re
from pathlib import Path

from django.conf import settings
from django.core.files import File as DjangoFile
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from products.models import Product, ProductBrand
from storage.models import File


class Command(BaseCommand):
    help = "Generate dummy products from images in static folder, storing files locally with duplicate prevention"
    featured = False

    def add_arguments(self, parser):
        parser.add_argument(
            '--static-path',
            type=str,
            default='dummy_data/static',
            help='Path to static folder containing product images organized by category'
        )
        parser.add_argument(
            '--merchant-email',
            type=str,
            default='merchant@demo.com',
            help='Email for the merchant user who will own the products'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be created without actually creating products'
        )
        parser.add_argument(
            '--delete-existing',
            action='store_true',
            help='Delete existing products for the merchant before creating new ones'
        )

        parser.add_argument(
            '--featured',
            action="store_true",
            help='Mark products as featured'
        )

    def handle(self, *_args, **options):
        static_path = options['static_path']
        merchant_email = options['merchant_email']
        dry_run = options['dry_run']
        delete_existing = options['delete_existing']
        self.featured = options.get('featured', False)

        # Check if FILE_UPLOAD_STORAGE is set to local
        if hasattr(settings, 'FILE_UPLOAD_STORAGE') and settings.FILE_UPLOAD_STORAGE != 'local':
            self.stdout.write(self.style.WARNING(
                'WARNING: FILE_UPLOAD_STORAGE is not set to "local". '
                'Please set FILE_UPLOAD_STORAGE=local in your settings before running this command.'
            ))
            response = input('Do you want to continue anyway? (y/N): ')
            if response.lower() != 'y':
                self.stdout.write(self.style.ERROR('Command cancelled.'))
                return

        self.stdout.write(self.style.SUCCESS(f'Starting product generation from {static_path}'))

        # Get or create merchant user
        merchant_user = self.get_or_create_merchant(merchant_email)

        if delete_existing and not dry_run:
            self.delete_existing_products(merchant_user)

        # Process static folder
        products_created = self.process_static_folder(static_path, merchant_user, dry_run)

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No products were actually created'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully created {products_created} products'))

    def get_or_create_merchant(self, email):
        """Get or create a merchant user"""
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'is_active': True,
                'role': User.Role.MERCHANT,
                'username': email.split('@')[0]
            }
        )

        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created merchant user: {email}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Using existing merchant user: {email}'))

        return user

    def delete_existing_products(self, merchant_user):
        """Delete existing products for the merchant"""
        deleted_count = Product.objects.filter(created_by=merchant_user).delete()[0]
        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted_count} existing products'))

    def process_static_folder(self, static_path, merchant_user, dry_run):
        """Process the static folder and create products"""
        static_dir = Path(static_path)

        if not static_dir.exists():
            raise CommandError(f'Static path does not exist: {static_path}')

        products_created = 0

        # Iterate through category folders
        for category_dir in static_dir.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith('.'):
                category_name = category_dir.name.replace('-', ' ').title()

                self.stdout.write(self.style.SUCCESS(f'Processing category: {category_name}'))

                # Get or create category
                category = self.get_or_create_category(category_name, merchant_user, dry_run)

                # Process images in category folder
                for image_file in category_dir.glob('*'):
                    if image_file.is_file() and image_file.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                        if self.process_image_file(image_file, category, merchant_user, dry_run):
                            products_created += 1

        return products_created

    def get_or_create_category(self, category_name, merchant_user, dry_run):
        """Get or create a product category"""
        from products.models import ProductCategory

        if dry_run:
            # Return a mock category for dry run
            category = ProductCategory(
                name=category_name,
                slug=category_name.lower().replace(' ', '-'),
                created_by=merchant_user
            )
            return category

        category, created = ProductCategory.objects.get_or_create(
            name=category_name,
            defaults={
                'slug': category_name.lower().replace(' ', '-'),
                'description': f'Products in the {category_name} category',
                'created_by': merchant_user
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'  Created category: {category_name}'))

        return category

    def process_image_file(self, image_file, category, merchant_user, dry_run):
        """Process a single image file and create a product"""
        try:
            # Extract product name from filename
            product_name = self.extract_product_name(image_file.name)

            # Extract brand name from product name or use category
            brand_name = self.extract_brand_name(product_name, category.name)

            self.stdout.write(f'  Processing: {product_name} ({brand_name})')

            if dry_run:
                return True

            # Get or create brand
            brand = self.get_or_create_brand(brand_name, merchant_user)

            # Check if file already exists to prevent duplicates
            file_obj = self.check_file_exists(image_file.name)

            if file_obj:
                self.stdout.write(f'    File already exists locally: {image_file.name}')
            else:
                # Store file locally
                file_obj = self.store_file_locally(image_file, merchant_user)
                self.stdout.write(f'    Stored file locally: {image_file.name}')

            # Create product
            product = self.create_product(product_name, brand, category, file_obj, merchant_user)

            self.stdout.write(self.style.SUCCESS(f'    Created product: {product.name}'))
            return True

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'    Error processing {image_file.name}: {str(e)}'))
            return False

    def extract_product_name(self, filename):
        """Extract product name from filename"""
        # Remove file extension and convert to readable name
        name_without_ext = Path(filename).stem

        # Remove common prefixes/suffixes and convert to title case
        product_name = name_without_ext.replace('_', ' ').replace('-', ' ').title()

        # Remove common patterns like p1810_00, p8500_wear, etc.
        product_name = re.sub(r'p\d+[_\-]\w*', '', product_name).strip()

        # If name is empty after cleaning, use the original stem
        if not product_name:
            product_name = name_without_ext.title()

        return product_name

    def extract_brand_name(self, product_name, category_name):
        """Extract brand name from product name or use category"""
        # Simple heuristic: use first word as brand, or category name
        words = product_name.split()
        if len(words) > 1:
            return words[0]
        else:
            return category_name

    def check_file_exists(self, filename):
        """Check if a file with the same original name already exists"""
        try:
            return File.objects.get(original_file_name=filename)
        except File.DoesNotExist:
            return None

    def store_file_locally(self, image_file, merchant_user):
        """Store a file locally using the storage service"""
        from storage.services import FileStandardUploadService

        # Open the file
        with open(image_file, 'rb') as f:
            django_file = DjangoFile(f, name=image_file.name)

            # Create upload service
            upload_service = FileStandardUploadService(merchant_user, django_file)

            # Store file locally
            file_obj = upload_service.create(
                file_name=image_file.name,
                file_type=mimetypes.guess_type(image_file.name)[0] or 'image/png'
            )

            return file_obj

    def get_or_create_brand(self, brand_name, merchant_user):
        """Get or create a product brand"""
        brand, created = ProductBrand.objects.get_or_create(
            name=brand_name,
            defaults={
                'description': f'{brand_name} brand products',
                'created_by': merchant_user
            }
        )

        if created:
            self.stdout.write(f'    Created brand: {brand_name}')

        return brand

    def create_product(self, product_name, brand, category, image_file, merchant_user):
        """Create a product with the given details"""
        # Generate realistic price
        price = round(random.uniform(10.0, 500.0), 2)

        # Create product
        product = Product.objects.create(
            name=product_name,
            description=f'{product_name} from {brand.name}. High quality product in the {category.name} category.',
            price=price,
            brand=brand,
            category=category,
            created_by=merchant_user,
            quantity=random.randint(10, 100),
            rating=round(random.uniform(3.5, 5.0), 2),
            is_featured=self.featured,
        )

        # Add image to product
        product.images.add(image_file)

        return product
