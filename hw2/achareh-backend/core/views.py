from .permissions import *
from .serializers import *
from .models import User, Ad, Bid, Comment, Ticket
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework import generics, status, permissions
from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.


@api_view(['GET'])
def say_hello(request):
    # return HttpResponse('Hello melika')
    # return render(request, 'hello.html', {'name': 'Mosh'})
    return Response({"message": "Services API works"})


# Create your views here.


@extend_schema(
    tags=['Authentication'],
    request=UserRegistrationSerializer,
    responses={201: UserSerializer},
    examples=[
        OpenApiExample(
            'Registration Example',
            value={
                'username': 'john_doe',
                'email': 'john@example.com',
                'phone_number': '09123456789',
                'password': 'securePass123',
                'first_name': 'John',
                'last_name': 'Doe'
            },
            request_only=True
        )
    ]
)
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Authentication'],
    request=LoginSerializer,
    responses={200: LoginResponseSerializer},
    examples=[
        OpenApiExample(
            'Login with Username',
            value={'login': 'john_doe', 'password': 'securePass123'},
            request_only=True
        ),
        OpenApiExample(
            'Login with Email',
            value={'login': 'john@example.com', 'password': 'securePass123'},
            request_only=True
        )
    ]
)
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })


@extend_schema(tags=['Authentication'], responses={200: UserSerializer})
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


@extend_schema(
    tags=['Users'],
    parameters=[
        OpenApiParameter('user_id', OpenApiTypes.INT, OpenApiParameter.PATH)
    ],
    request={'role': 'string'},
    responses={200: UserSerializer}
)
class ChangeUserRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated, CanChangeUserRole]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        new_role = request.data.get('role')

        if new_role not in [choice[0] for choice in User.Role.choices]:
            return Response(
                {'error': 'Invalid role'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.role == User.Role.SUPPORT and new_role != User.Role.CONTRACTOR:
            return Response(
                {'error': 'Support can only assign contractor role'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.role = new_role
        user.save()
        return Response(UserSerializer(user).data)


@extend_schema(tags=['Ads'],
               request=AdCreateSerializer,
               responses={201: AdSerializer},
               examples=[
    OpenApiExample(
        'Create Ad Example',
        value={
            'title': 'Need a plumber',
            'description': 'Kitchen sink is leaking',
            'category': 'Plumbing'
        },
        request_only=True
    )
]
)
class AdListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, CanCreateAd]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdCreateSerializer
        return AdSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Ad.objects.all()

        if user.role not in [User.Role.SUPPORT, User.Role.ADMIN] and not user.is_superuser:
            queryset = queryset.exclude(
                Q(status=Ad.Status.CANCELED) & ~Q(creator=user)
            )

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__icontains=category)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


@extend_schema(tags=['Ads'],
               responses={200: AdSerializer},
               request=AdSerializer
               )
class AdDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated, CanModifyAd]

    def get_queryset(self):
        user = self.request.user
        queryset = Ad.objects.all()

        if user.role not in [User.Role.SUPPORT, User.Role.ADMIN] and not user.is_superuser:
            queryset = queryset.exclude(
                Q(status=Ad.Status.CANCELED) & ~Q(creator=user)
            )

        return queryset


@extend_schema(tags=['Ads'],
               request=AssignContractorSerializer,
               responses={200: AdSerializer}
               )
class AssignContractorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ad_id):
        ad = get_object_or_404(Ad, id=ad_id)

        if ad.creator != request.user:
            return Response(
                {'error': 'Only ad creator can assign contractor'},
                status=status.HTTP_403_FORBIDDEN
            )

        if ad.status != Ad.Status.OPEN:
            return Response(
                {'error': 'Ad is not open'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AssignContractorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contractor_id = serializer.validated_data['contractor_id']

        if not ad.bids.filter(contractor_id=contractor_id).exists():
            return Response(
                {'error': 'Contractor has not bid on this ad'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ad.performer_id = contractor_id
        ad.status = Ad.Status.ASSIGNED
        ad.save()

        return Response(AdSerializer(ad).data)


@extend_schema(tags=['Ads'], responses={200: AdSerializer})
class CancelAdView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ad_id):
        ad = get_object_or_404(Ad, id=ad_id)

        if ad.creator != request.user:
            return Response(
                {'error': 'Only ad creator can cancel'},
                status=status.HTTP_403_FORBIDDEN
            )

        if ad.status == Ad.Status.COMPLETED:
            return Response(
                {'error': 'Cannot cancel completed ad'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ad.status = Ad.Status.CANCELED
        ad.save()

        return Response(AdSerializer(ad).data)


@extend_schema(tags=['Ads'], responses={200: AdSerializer})
class CompleteWorkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ad_id):
        ad = get_object_or_404(Ad, id=ad_id)

        if ad.performer != request.user:
            return Response(
                {'error': 'Only assigned contractor can mark as complete'},
                status=status.HTTP_403_FORBIDDEN
            )

        if ad.status != Ad.Status.ASSIGNED:
            return Response(
                {'error': 'Ad is not assigned'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ad.work_completed_at = timezone.now()
        ad.save()

        return Response(AdSerializer(ad).data)


@extend_schema(tags=['Ads'], responses={200: AdSerializer})
class ConfirmCompletionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ad_id):
        ad = get_object_or_404(Ad, id=ad_id)

        if ad.creator != request.user:
            return Response(
                {'error': 'Only ad creator can confirm completion'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not ad.work_completed_at:
            return Response(
                {'error': 'Contractor has not marked work as complete'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ad.status = Ad.Status.COMPLETED
        ad.save()

        return Response(AdSerializer(ad).data)


@extend_schema(tags=['Ads'],
               request=ScheduleSerializer,
               responses={200: AdSerializer}
               )
class SetScheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ad_id):
        ad = get_object_or_404(Ad, id=ad_id)

        if ad.performer != request.user:
            return Response(
                {'error': 'Only assigned contractor can set schedule'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        execution_time = serializer.validated_data['execution_time']

        overlapping = Ad.objects.filter(
            performer=request.user,
            status=Ad.Status.ASSIGNED,
            execution_time__isnull=False
        ).exclude(id=ad_id).filter(
            execution_time__date=execution_time.date()
        )

        if overlapping.exists():
            return Response(
                {'error': 'Schedule conflict with another job'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ad.execution_time = execution_time
        ad.execution_location = serializer.validated_data['execution_location']
        ad.save()

        return Response(AdSerializer(ad).data)


@extend_schema(tags=['Contractors'],
               parameters=[
    OpenApiParameter('date', OpenApiTypes.DATE,
                     description='Filter by date (YYYY-MM-DD)')
],
    responses={200: AdSerializer(many=True)}
)
class ContractorScheduleView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        date_param = self.request.query_params.get('date')
        queryset = Ad.objects.filter(
            performer=self.request.user,
            status=Ad.Status.ASSIGNED,
            execution_time__isnull=False
        ).order_by('execution_time')

        if date_param:
            queryset = queryset.filter(execution_time__date=date_param)

        return queryset


@extend_schema(tags=['Bids'],
               request=BidCreateSerializer,
               responses={201: BidSerializer}
               )
class BidListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, CanCreateBid]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BidCreateSerializer
        return BidSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CONTRACTOR:
            return Bid.objects.filter(contractor=user)
        elif user.role == User.Role.CUSTOMER:
            return Bid.objects.filter(ad__creator=user)
        return Bid.objects.all()

    def perform_create(self, serializer):
        ad = serializer.validated_data['ad']

        if ad.status != Ad.Status.OPEN:
            raise serializers.ValidationError("Ad is not open for bidding")

        serializer.save(contractor=self.request.user)


@extend_schema(tags=['Bids'], responses={200: BidSerializer})
class BidDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated, CanModifyBid]

    def get_queryset(self):
        return Bid.objects.filter(contractor=self.request.user)


@extend_schema(tags=['Ads'], responses={200: BidSerializer(many=True)})
class AdBidsView(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        ad_id = self.kwargs['ad_id']
        ad = get_object_or_404(Ad, id=ad_id)

        if ad.creator != self.request.user:
            return Bid.objects.none()

        return ad.bids.all()


@extend_schema(tags=['Comments'],
               request=CommentCreateSerializer,
               responses={201: CommentSerializer}
               )
class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, CanCreateComment]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentCreateSerializer
        return CommentSerializer

    def get_queryset(self):
        return Comment.objects.all()

    def perform_create(self, serializer):
        ad = serializer.validated_data['ad']

        if ad.status != Ad.Status.COMPLETED:
            raise serializers.ValidationError(
                "Can only comment on completed ads")

        if ad.creator != self.request.user:
            raise serializers.ValidationError("Only ad creator can comment")

        if Comment.objects.filter(ad=ad, customer=self.request.user).exists():
            raise serializers.ValidationError("Already commented on this ad")

        serializer.save(
            customer=self.request.user,
            performer=ad.performer
        )


@extend_schema(tags=['Comments'],
               parameters=[
    OpenApiParameter('contractor_id', OpenApiTypes.INT),
    OpenApiParameter('rating', OpenApiTypes.INT,
                     description='Filter by rating (1-5)'),
],
    responses={200: CommentSerializer(many=True)}
)
class ContractorCommentsView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        contractor_id = self.request.query_params.get('contractor_id')
        rating = self.request.query_params.get('rating')

        if not contractor_id:
            return Comment.objects.none()

        queryset = Comment.objects.filter(performer_id=contractor_id)

        if rating:
            queryset = queryset.filter(rating=rating)

        return queryset


@extend_schema(tags=['Contractors'], responses={200: ContractorProfileSerializer})
class ContractorProfileView(generics.RetrieveAPIView):
    serializer_class = ContractorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.filter(role=User.Role.CONTRACTOR)


@extend_schema(tags=['Contractors'],
               parameters=[
    OpenApiParameter('min_rating', OpenApiTypes.FLOAT,
                     description='Minimum average rating'),
    OpenApiParameter('min_comments', OpenApiTypes.INT,
                     description='Minimum number of comments'),
    OpenApiParameter('ordering', OpenApiTypes.STR,
                     description='Order by: rating, -rating, comments, -comments'),
],
    responses={200: ContractorListSerializer(many=True)}
)
class ContractorListView(generics.ListAPIView):
    serializer_class = ContractorListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.filter(role=User.Role.CONTRACTOR).annotate(
            avg_rating=Avg('received_comments__rating'),
            comment_count=Count('received_comments')
        )

        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(avg_rating__gte=float(min_rating))

        min_comments = self.request.query_params.get('min_comments')
        if min_comments:
            queryset = queryset.filter(comment_count__gte=int(min_comments))

        ordering = self.request.query_params.get('ordering', '-avg_rating')
        if ordering == 'rating':
            queryset = queryset.order_by('avg_rating')
        elif ordering == '-rating':
            queryset = queryset.order_by('-avg_rating')
        elif ordering == 'comments':
            queryset = queryset.order_by('comment_count')
        elif ordering == '-comments':
            queryset = queryset.order_by('-comment_count')

        return queryset


@extend_schema(tags=['Users'], responses={200: AdSerializer(many=True)})
class CustomerProfileAdsView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id', self.request.user.id)
        return Ad.objects.filter(creator_id=user_id)


@extend_schema(tags=['Users'], responses={200: AdSerializer(many=True)})
class ContractorPerformedAdsView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id', self.request.user.id)
        return Ad.objects.filter(performer_id=user_id)


@extend_schema(tags=['Tickets'],
               request=TicketCreateSerializer,
               responses={201: TicketSerializer}
               )
class TicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TicketCreateSerializer
        return TicketSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in [User.Role.SUPPORT, User.Role.ADMIN] or user.is_superuser:
            return Ticket.objects.all()
        return Ticket.objects.filter(creator=user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


@extend_schema(tags=['Tickets'],
               responses={200: TicketSerializer},
               request=TicketSerializer
               )
class TicketDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated, CanModifyTicket]

    def get_queryset(self):
        user = self.request.user
        if user.role in [User.Role.SUPPORT, User.Role.ADMIN] or user.is_superuser:
            return Ticket.objects.all()
        return Ticket.objects.filter(creator=user)


@extend_schema(tags=['Tickets'],
               request=TicketResponseSerializer,
               responses={200: TicketSerializer}
               )
class RespondToTicketView(APIView):
    permission_classes = [permissions.IsAuthenticated, CanRespondToTicket]

    def post(self, request, ticket_id):
        ticket = get_object_or_404(Ticket, id=ticket_id)

        serializer = TicketResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket.response = serializer.validated_data['response']
        ticket.responded_by = request.user
        ticket.status = serializer.validated_data.get(
            'status', Ticket.Status.CLOSED)
        ticket.save()

        return Response(TicketSerializer(ticket).data)
