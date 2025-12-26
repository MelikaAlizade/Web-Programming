from django.urls import path
from .views import *

# URLConf
urlpatterns = [
    # path('hello/', views.say_hello),
    # path('services/', say_hello),
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),

    # User Management
    path('users/<int:user_id>/change-role/',
         ChangeUserRoleView.as_view(), name='change-role'),
    path('users/<int:user_id>/ads/',
         CustomerProfileAdsView.as_view(), name='customer-ads'),
    path('users/<int:user_id>/performed-ads/',
         ContractorPerformedAdsView.as_view(), name='contractor-performed-ads'),

    # Ads
    path('ads/', AdListCreateView.as_view(), name='ad-list-create'),
    path('ads/<int:pk>/', AdDetailView.as_view(), name='ad-detail'),
    path('ads/<int:ad_id>/assign/',
         AssignContractorView.as_view(), name='ad-assign'),
    path('ads/<int:ad_id>/cancel/', CancelAdView.as_view(), name='ad-cancel'),
    path('ads/<int:ad_id>/complete/',
         CompleteWorkView.as_view(), name='ad-complete'),
    path('ads/<int:ad_id>/confirm/',
         ConfirmCompletionView.as_view(), name='ad-confirm'),
    path('ads/<int:ad_id>/schedule/',
         SetScheduleView.as_view(), name='ad-schedule'),
    path('ads/<int:ad_id>/bids/', AdBidsView.as_view(), name='ad-bids'),

    # Bids
    path('bids/', BidListCreateView.as_view(), name='bid-list-create'),
    path('bids/<int:pk>/', BidDetailView.as_view(), name='bid-detail'),

    # Comments
    path('comments/', CommentListCreateView.as_view(), name='comment-list-create'),
    path('comments/contractor/', ContractorCommentsView.as_view(),
         name='contractor-comments'),

    # Contractors
    path('contractors/', ContractorListView.as_view(), name='contractor-list'),
    path('contractors/<int:pk>/', ContractorProfileView.as_view(),
         name='contractor-profile'),
    path('contractors/schedule/', ContractorScheduleView.as_view(),
         name='contractor-schedule'),

    # Tickets
    path('tickets/', TicketListCreateView.as_view(), name='ticket-list-create'),
    path('tickets/<int:pk>/', TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<int:ticket_id>/respond/',
         RespondToTicketView.as_view(), name='ticket-respond'),

]
