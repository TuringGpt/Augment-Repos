from django.db import models
from core.models import BaseModel
from accounts.models import User
from mptt.models import MPTTModel, TreeForeignKey
from storage.models import File


class ProductBrand(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_brands')
    image = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

class ProductCategory(MPTTModel, BaseModel):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(null=True, blank=True)
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_categories')
    image = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True)
    class MPTTMeta:
        order_insertion_by = ['name']

    def __str__(self):
        return self.name
    

class ProductManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')
    
    def get_user_products(self, user):
        return self.get_queryset().filter(created_by=user)

class Product(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    brand = models.ForeignKey(ProductBrand, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='products')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    quantity = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    images = models.ManyToManyField(File, related_name='products', blank=True)
    objects:ProductManager = ProductManager()

   

    
