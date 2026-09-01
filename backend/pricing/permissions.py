from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Same admin check used throughout ecommerce/views.py (no shared
    permissions module exists in this project — every app repeats this
    inline check rather than importing one; kept consistent here)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and (user.is_staff or user.user_type == 'admin')
        )
