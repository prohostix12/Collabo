
import os
import sys
import django
from pathlib import Path

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()

from accounts.models import User, InfluencerProfile

def test_emoji_support():
    print("Testing Emoji Support...")
    
    # Create or get a test user
    email = "emoji_test@example.com"
    try:
        user = User.objects.get(email=email)
        print(f"Found existing user: {user.email}")
        # Clean up
        user.delete()
        print("Deleted existing user")
    except User.DoesNotExist:
        pass
        
    username = "emoji_tester"
    user = User.objects.create_user(username=username, email=email, password="password123", user_type="influencer")
    
    # Create profile with emojis
    test_bio = "Hello world! 🌍👋 This is a test with emojis: 😊🚀🎉"
    print(f"Original Bio: {test_bio}")
    
    profile = InfluencerProfile.objects.create(
        user=user,
        bio=test_bio,
        category="tech"
    )
    
    # Reload from DB
    profile.refresh_from_db()
    print(f"Saved Bio:    {profile.bio}")
    
    if profile.bio == test_bio:
        print("SUCCESS: Bio matches original text.")
    else:
        print("FAILURE: Bio does not match!")
        print(f"Original hex: {test_bio.encode('utf-8').hex()}")
        print(f"Saved hex:    {profile.bio.encode('utf-8').hex()}")
        
    # Clean up
    user.delete()

if __name__ == "__main__":
    test_emoji_support()
