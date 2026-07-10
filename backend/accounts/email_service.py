"""
Email service for sending approval notifications
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_welcome_email(user):
    """Send welcome email to a newly registered user."""
    try:
        name = user.first_name or user.username
        subject = '👋 Welcome to Collabo!'
        message = f"""
Hi {name}!

Welcome to Collabo — your one-stop marketplace for smart shopping and earning! 🎉

Your account is now ready. Here's what you can do:
✓ Browse thousands of products
✓ Earn rewards on every purchase
✓ Share products and earn commissions
✓ Track your orders in real time

You've received 10 reward points as a welcome bonus!

Start shopping: https://collabo.co.in

Happy Shopping,
Team Collabo
        """.strip()

        html_message = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 36px 30px; text-align: center; border-radius: 12px 12px 0 0; }}
    .header h1 {{ margin: 0; font-size: 26px; }}
    .header p {{ margin: 8px 0 0; opacity: 0.9; font-size: 14px; }}
    .content {{ background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #f0f0f0; }}
    .bonus {{ background: #fff7ed; border: 1px solid #fed7aa; padding: 14px 20px; border-radius: 10px; text-align: center; margin: 20px 0; font-weight: bold; color: #c2410c; }}
    .features {{ background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0; }}
    .feature {{ padding: 7px 0; color: #374151; }}
    .feature::before {{ content: "✓"; color: #f97316; font-weight: bold; margin-right: 10px; }}
    .btn {{ display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 20px 0; }}
    .footer {{ text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 Welcome to Collabo!</h1>
      <p>Your smart shopping journey starts here</p>
    </div>
    <div class="content">
      <p>Hi <strong>{name}</strong>!</p>
      <p>We're thrilled to have you on board. Your account is ready and waiting for you.</p>
      <div class="bonus">🎁 You've received <strong>10 Reward Points</strong> as a welcome bonus!</div>
      <div class="features">
        <div class="feature">Browse thousands of quality products</div>
        <div class="feature">Earn rewards on every purchase</div>
        <div class="feature">Share products and earn commissions</div>
        <div class="feature">Track your orders in real time</div>
      </div>
      <center><a href="https://collabo.co.in" class="btn">Start Shopping Now</a></center>
      <p>Questions? We're always here at <a href="mailto:support@collabo.co.in">support@collabo.co.in</a></p>
      <div class="footer">
        <p>Best regards,<br><strong>Team Collabo</strong></p>
        <p>© 2026 Collabo Marketplace. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
        """.strip()

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or 'Collabo <collaboproh@gmail.com>',
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
        return False


class ApprovalEmailService:
    """Service for sending approval-related emails"""
    
    @staticmethod
    def send_approval_email(user):
        """
        Send approval notification email to influencer
        
        Args:
            user: User object that was approved
        """
        try:
            subject = 'Your Account Has Been Approved! 🎉'
            
            # Email context
            context = {
                'user_name': user.username or user.first_name or 'Influencer',
                'login_url': f"{settings.FRONTEND_URL}/login",
                'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
                'support_email': settings.DEFAULT_FROM_EMAIL,
            }
            
            # Plain text message
            message = f"""
Hello {context['user_name']}!

Great news! Your influencer account has been approved and is now active.

You can now:
✓ Login to your dashboard
✓ Browse and apply for campaigns
✓ Connect with brands
✓ Start earning

Login here: {context['login_url']}

If you have any questions, feel free to reach out to our support team at {context['support_email']}.

Welcome to Collabo!

Best regards,
The Collabo Team
            """.strip()
            
            # HTML message (optional, for better formatting)
            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .features {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .feature {{ padding: 10px 0; }}
        .feature::before {{ content: "✓"; color: #667eea; font-weight: bold; margin-right: 10px; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Account Approved!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{context['user_name']}</strong>!</p>
            
            <p>Great news! Your influencer account has been approved and is now active.</p>
            
            <div class="features">
                <div class="feature">Login to your dashboard</div>
                <div class="feature">Browse and apply for campaigns</div>
                <div class="feature">Connect with brands</div>
                <div class="feature">Start earning</div>
            </div>
            
            <center>
                <a href="{context['login_url']}" class="button">Login to Dashboard</a>
            </center>
            
            <p>If you have any questions, feel free to reach out to our support team at <a href="mailto:{context['support_email']}">{context['support_email']}</a>.</p>
            
            <p><strong>Welcome to Collabo!</strong></p>
            
            <div class="footer">
                <p>Best regards,<br>The Collabo Team</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
            """.strip()
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Approval email sent successfully to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send approval email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_rejection_email(user, reason=''):
        """
        Send rejection notification email to influencer
        
        Args:
            user: User object that was rejected
            reason: Reason for rejection
        """
        try:
            subject = 'Update on Your Account Application'
            
            context = {
                'user_name': user.username or user.first_name or 'Influencer',
                'reason': reason,
                'support_email': settings.DEFAULT_FROM_EMAIL,
            }
            
            message = f"""
Hello {context['user_name']},

Thank you for your interest in joining Collabo.

After reviewing your application, we regret to inform you that we are unable to approve your account at this time.

{f"Reason: {reason}" if reason else ""}

If you believe this is an error or would like to discuss this decision, please contact our support team at {context['support_email']}.

Best regards,
The Collabo Team
            """.strip()
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Rejection email sent successfully to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send rejection email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_seller_approval_email(user, store_name):
        try:
            subject = 'Your Seller Account Has Been Approved! 🎉'
            name = user.username or user.first_name or 'Seller'
            login_url = f"{settings.FRONTEND_URL}/login"
            support_email = settings.DEFAULT_FROM_EMAIL

            message = f"""
Hello {name}!

Great news! Your seller account for "{store_name}" has been approved and is now active on Collabo.

You can now:
✓ List products on the marketplace
✓ Manage your inventory and orders
✓ Track revenue and analytics
✓ Request payouts for your earnings

Login here: {login_url}

If you have any questions, reach out to us at {support_email}.

Welcome to Collabo!

Best regards,
The Collabo Team
            """.strip()

            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .features {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .feature {{ padding: 10px 0; }}
        .feature::before {{ content: "✓"; color: #f97316; font-weight: bold; margin-right: 10px; }}
        .store-name {{ background: #fff7ed; border: 1px solid #fed7aa; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-align: center; margin: 15px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Seller Account Approved!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{name}</strong>!</p>
            <p>Your seller account has been approved and is now active.</p>
            <div class="store-name">🏪 {store_name}</div>
            <div class="features">
                <div class="feature">List products on the marketplace</div>
                <div class="feature">Manage inventory and orders</div>
                <div class="feature">Track revenue and analytics</div>
                <div class="feature">Request payouts for your earnings</div>
            </div>
            <center><a href="{login_url}" class="button">Go to Seller Dashboard</a></center>
            <p>Questions? Contact us at <a href="mailto:{support_email}">{support_email}</a>.</p>
            <div class="footer">
                <p>Best regards,<br>The Collabo Team</p>
            </div>
        </div>
    </div>
</body>
</html>
            """.strip()

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Seller approval email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send seller approval email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_seller_rejection_email(user, store_name, reason=''):
        try:
            subject = 'Update on Your Seller Application'
            name = user.username or user.first_name or 'Seller'
            support_email = settings.DEFAULT_FROM_EMAIL
            reapply_url = f"{settings.FRONTEND_URL}"

            reason_text = f"\nReason: {reason}\n" if reason else ""

            message = f"""
Hello {name},

Thank you for applying to sell on Collabo with your store "{store_name}".

After reviewing your application, we are unable to approve your seller account at this time.
{reason_text}
You can update your details and re-apply at any time by visiting: {reapply_url}

If you have questions, contact us at {support_email}.

Best regards,
The Collabo Team
            """.strip()

            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .reason-box {{ background: #fef2f2; border: 1px solid #fecaca; padding: 15px 20px; border-radius: 8px; margin: 15px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Update</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{name}</strong>,</p>
            <p>Thank you for applying to sell on Collabo with your store "<strong>{store_name}</strong>".</p>
            <p>After reviewing your application, we are unable to approve your seller account at this time.</p>
            {f'<div class="reason-box"><strong>Reason:</strong> {reason}</div>' if reason else ''}
            <p>You can update your details and re-apply at any time:</p>
            <center><a href="{reapply_url}" class="button">Update & Re-apply</a></center>
            <p>Questions? Contact us at <a href="mailto:{support_email}">{support_email}</a>.</p>
            <div class="footer">
                <p>Best regards,<br>The Collabo Team</p>
            </div>
        </div>
    </div>
</body>
</html>
            """.strip()

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Seller rejection email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send seller rejection email to {user.email}: {str(e)}")
            return False
