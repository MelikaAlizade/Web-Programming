from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

# Create your models here.


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        CONTRACTOR = 'CONTRACTOR', 'Contractor'
        SUPPORT = 'SUPPORT', 'Support'
        ADMIN = 'ADMIN', 'Admin'

    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=15, unique=True, null=True, blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.role})"


class Ad(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        COMPLETED = 'COMPLETED', 'Completed'

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_ads'
    )
    performer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='performed_ads'
    )
    execution_time = models.DateTimeField(null=True, blank=True)
    execution_location = models.CharField(
        max_length=255, null=True, blank=True)
    work_completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ads'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.status}"


class Bid(models.Model):
    ad = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name='bids')
    contractor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bids'
    )
    proposed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bids'
        unique_together = ['ad', 'contractor']
        ordering = ['-created_at']

    def __str__(self):
        return f"Bid by {self.contractor.username} for {self.ad.title}"


class Comment(models.Model):
    ad = models.ForeignKey(Ad, on_delete=models.CASCADE,
                           related_name='comments')
    performer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_comments'
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='given_comments'
    )
    text = models.TextField()
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.customer.username} - Rating: {self.rating}"


class Ticket(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        CLOSED = 'CLOSED', 'Closed'

    title = models.CharField(max_length=200)
    message = models.TextField()
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    ad = models.ForeignKey(
        Ad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )
    response = models.TextField(blank=True)
    responded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responded_tickets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f"Ticket #{self.id} - {self.title}"
