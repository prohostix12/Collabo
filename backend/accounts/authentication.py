from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

# Only bump last_active_at this often per session, so a chatty client doesn't
# turn "show when this device was last active" into a write on every request.
_ACTIVITY_TOUCH_INTERVAL = timezone.timedelta(minutes=2)


class SafeJWTAuthentication(JWTAuthentication):
    """Behaves like JWTAuthentication, but a stale token (expired, malformed,
    or pointing at a user that no longer exists — e.g. an admin-deleted
    account) is treated as "not logged in" instead of failing the request
    outright. Without this, a browser holding such a token gets 401s even on
    AllowAny endpoints (store settings, categories, products), since DRF
    authentication classes raise before permission checks ever run.

    Also enforces per-device session revocation: every token issued since the
    device-management feature shipped carries a `session_id` claim tied to a
    UserSession row. If that row has been revoked (seller logged themselves
    out of a lost phone, for example), the request is treated as unauthenticated
    immediately — not just once the access token's own expiry catches up."""

    def authenticate(self, request):
        try:
            result = super().authenticate(request)
        except (AuthenticationFailed, InvalidToken, TokenError):
            return None

        if result is None:
            return None

        user, validated_token = result
        session_id = validated_token.get('session_id')
        if session_id:
            from .models import UserSession
            session = UserSession.objects.filter(session_id=session_id).first()
            if session is None or session.revoked:
                return None
            if timezone.now() - session.last_active_at > _ACTIVITY_TOUCH_INTERVAL:
                UserSession.objects.filter(pk=session.pk).update(last_active_at=timezone.now())

        return user, validated_token

