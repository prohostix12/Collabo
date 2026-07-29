from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class SafeJWTAuthentication(JWTAuthentication):
    """Behaves like JWTAuthentication, but a stale token (expired, malformed,
    or pointing at a user that no longer exists — e.g. an admin-deleted
    account) is treated as "not logged in" instead of failing the request
    outright. Without this, a browser holding such a token gets 401s even on
    AllowAny endpoints (store settings, categories, products), since DRF
    authentication classes raise before permission checks ever run."""

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (AuthenticationFailed, InvalidToken, TokenError):
            return None

