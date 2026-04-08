from core.service import BaseCacheService

class UserProfileCacheService(BaseCacheService):
    OBJECT_NAME = "user_profile"
    VERSION = 1


class AdminUserCacheService(BaseCacheService):
    OBJECT_NAME = "admin_user_list"
    VERSION = 1
