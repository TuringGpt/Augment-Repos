from django.core.management.base import BaseCommand
from storage.models import File
from products.models import Product
import os


class Command(BaseCommand):
    help = "Clean up broken file records and products created by generate_products script"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be deleted'))

        # Find all File objects
        all_files = File.objects.all()
        broken_files = []
        
        for file_obj in all_files:
            if file_obj.file:
                # Check if the file exists on disk
                file_path = file_obj.file.path if hasattr(file_obj.file, 'path') else None
                if file_path and not os.path.exists(file_path):
                    broken_files.append(file_obj)
                    self.stdout.write(f'Broken file: {file_obj.id} - {file_obj.file.name}')
            else:
                broken_files.append(file_obj)
                self.stdout.write(f'File with no file field: {file_obj.id}')

        self.stdout.write(self.style.WARNING(f'\nFound {len(broken_files)} broken file records'))

        if not dry_run and broken_files:
            # Delete products that use these files
            products_to_delete = Product.objects.filter(images__in=broken_files).distinct()
            product_count = products_to_delete.count()
            
            if product_count > 0:
                self.stdout.write(f'Deleting {product_count} products that use broken files...')
                products_to_delete.delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted {product_count} products'))

            # Delete the broken file records
            self.stdout.write(f'Deleting {len(broken_files)} broken file records...')
            for file_obj in broken_files:
                file_obj.delete()
            
            self.stdout.write(self.style.SUCCESS(f'Successfully deleted {len(broken_files)} broken file records'))
        elif dry_run:
            products_to_delete = Product.objects.filter(images__in=broken_files).distinct()
            product_count = products_to_delete.count()
            self.stdout.write(self.style.WARNING(f'\nWould delete {product_count} products'))
            self.stdout.write(self.style.WARNING(f'Would delete {len(broken_files)} file records'))

