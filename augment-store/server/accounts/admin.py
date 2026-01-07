from django.contrib import admin

from .models import MerchantDetail, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "first_name", "last_name", "role"]
    list_filter = ["role"]
    search_fields = ["email", "first_name", "last_name"]

@admin.register(MerchantDetail)
class MerchantDetailAdmin(admin.ModelAdmin):
    list_display = ["user", "store_name", "store_description"]
    search_fields = ["user__email", "store_name"]
