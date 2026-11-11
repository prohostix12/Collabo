from django.conf import settings
from django.db import models


class OutreachTemplate(models.Model):
    """An email template the admin can pick when sending to brands.
    Placeholders: {{brand_name}}, {{contact_person}}, {{category}}."""
    name = models.CharField(max_length=120)
    subject = models.CharField(max_length=255)
    body = models.TextField(help_text='Plain text. Blank line = new paragraph, "- " = bullet, **bold**, links are made clickable.')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class OutreachContact(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('opted_out', 'Opted out'),
        ('bounced', 'Bounced / invalid'),
    )
    brand_name = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=120, blank=True, db_index=True)
    email = models.EmailField(unique=True)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=60, blank=True)
    website = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='active', db_index=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    times_sent = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'brand_name', 'email']

    def __str__(self):
        return f"{self.brand_name or self.email} <{self.email}>"


class OutreachCampaign(models.Model):
    STATUS_CHOICES = (
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    template = models.ForeignKey(OutreachTemplate, null=True, blank=True, on_delete=models.SET_NULL, related_name='campaigns')
    template_name = models.CharField(max_length=120)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    add_footer = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='running')
    note = models.CharField(max_length=255, blank=True)
    heartbeat = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']


class OutreachSend(models.Model):
    STATUS_CHOICES = (
        ('queued', 'Queued'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    )
    campaign = models.ForeignKey(OutreachCampaign, on_delete=models.CASCADE, related_name='sends')
    contact = models.ForeignKey(OutreachContact, null=True, blank=True, on_delete=models.SET_NULL, related_name='sends')
    email = models.EmailField()
    brand_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='queued', db_index=True)
    error = models.CharField(max_length=500, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['id']
