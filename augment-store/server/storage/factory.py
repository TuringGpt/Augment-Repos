from factory import Faker, LazyAttribute, SubFactory
from factory.django import DjangoModelFactory, FileField

from accounts.factory import UserFactory
from storage.utils import file_generate_name


class FileFactory(DjangoModelFactory):
    original_file_name = Faker("file_name", extension="jpg")
    file_name = LazyAttribute(lambda obj: file_generate_name(obj.original_file_name))
    file_type = "image/jpeg"
    created_by = SubFactory(UserFactory)
    file = FileField(filename="test_image.jpg")

    class Meta:
        model = "storage.File"

