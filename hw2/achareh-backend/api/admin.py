from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Ad, Bid, Comment, Ticket

# Register your models here.


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'phone_number', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'role')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('phone_number', 'role')}),
    )


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'category',
                    'status', 'creator', 'performer', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description', 'creator__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'category', 'status')
        }),
        ('Users', {
            'fields': ('creator', 'performer')
        }),
        ('Execution', {
            'fields': ('execution_time', 'execution_location', 'work_completed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ['id', 'ad', 'contractor', 'proposed_price', 'created_at']
    list_filter = ['created_at']
    search_fields = ['ad__title', 'contractor__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'ad', 'customer',
                    'performer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['text', 'customer__username', 'performer__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'creator',
                    'status', 'responded_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'message', 'creator__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Ticket Info', {
            'fields': ('title', 'message', 'creator', 'ad', 'status')
        }),
        ('Response', {
            'fields': ('response', 'responded_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
