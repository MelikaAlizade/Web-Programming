from rest_framework import permissions
from .models import User, Ad


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.creator == request.user if hasattr(obj, 'creator') else obj == request.user


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.CUSTOMER


class IsContractor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.CONTRACTOR


class IsSupport(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.SUPPORT


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == User.Role.ADMIN or request.user.is_superuser
        )


class CanCreateAd(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST':
            return request.user.is_authenticated and request.user.role == User.Role.CUSTOMER
        return True


class CanModifyAd(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            # everyone can view filtered by visibility rules in query.
            return True
        # creator can modify
        return obj.creator == request.user


class CanCreateBid(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST':
            return request.user.is_authenticated and request.user.role == User.Role.CONTRACTOR
        return True


class CanModifyBid(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.contractor == request.user


class CanCreateComment(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST':
            return request.user.is_authenticated and request.user.role == User.Role.CUSTOMER
        return True


class CanRespondToTicket(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == User.Role.SUPPORT or
            request.user.role == User.Role.ADMIN or
            request.user.is_superuser
        )


class CanModifyTicket(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            # creator and support can view
            return obj.creator == request.user or request.user.role in [
                User.Role.SUPPORT, User.Role.ADMIN
            ] or request.user.is_superuser

        if request.method == 'DELETE':
            # support can delete any ticket
            return request.user.role in [User.Role.SUPPORT, User.Role.ADMIN] or request.user.is_superuser

        # creator can modify their own ticket
        return obj.creator == request.user


class CanChangeUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in [User.Role.ADMIN, User.Role.SUPPORT] or
            request.user.is_superuser
        )


class CanViewCanceledAd(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.status != Ad.Status.CANCELED:
            return True

        return (
            obj.creator == request.user or
            request.user.role in [User.Role.SUPPORT, User.Role.ADMIN] or
            request.user.is_superuser
        )
