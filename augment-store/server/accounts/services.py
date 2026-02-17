from core.service import BaseCacheService

class UserProfileCacheService(BaseCacheService):
    OBJECT_NAME = "user_profile"
    VERSION = 1
