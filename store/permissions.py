
from rest_framework.permissions import BasePermission


class IsStoreAdmin(BasePermission):

    message = "Only store admins can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )
