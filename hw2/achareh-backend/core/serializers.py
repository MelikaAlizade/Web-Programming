from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Avg, Count
from .models import User, Ad, Bid, Comment, Ticket


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number',
                  'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        login = data['login']
        password = data['password']

        user = authenticate(username=login, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number',
                  'role', 'first_name', 'last_name']
        read_only_fields = ['role']


class LoginResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = UserSerializer()


class ContractorProfileSerializer(serializers.ModelSerializer):
    completed_ads_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_comments = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'completed_ads_count', 'average_rating', 'total_comments', 'recent_comments'
        ]

    def get_completed_ads_count(self, obj):
        return obj.performed_ads.filter(status=Ad.Status.COMPLETED).count()

    def get_average_rating(self, obj):
        avg = obj.received_comments.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 2) if avg else 0

    def get_total_comments(self, obj):
        return obj.received_comments.count()

    def get_recent_comments(self, obj):
        comments = obj.received_comments.all()[:10]
        return CommentSerializer(comments, many=True).data


class AdSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    performer = UserSerializer(read_only=True)
    bids_count = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'description', 'category', 'status',
            'creator', 'performer', 'execution_time', 'execution_location',
            'work_completed_at', 'created_at', 'updated_at', 'bids_count'
        ]
        read_only_fields = ['status', 'performer', 'work_completed_at']

    def get_bids_count(self, obj):
        return obj.bids.count()


class AdCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ad
        fields = ['title', 'description', 'category']


class BidSerializer(serializers.ModelSerializer):
    contractor = UserSerializer(read_only=True)
    ad_title = serializers.CharField(source='ad.title', read_only=True)

    class Meta:
        model = Bid
        fields = ['id', 'ad', 'ad_title', 'contractor',
                  'proposed_price', 'message', 'created_at']
        read_only_fields = ['contractor']


class BidCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ['ad', 'proposed_price', 'message']


class CommentSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    performer = UserSerializer(read_only=True)
    ad_title = serializers.CharField(source='ad.title', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'ad', 'ad_title', 'performer',
                  'customer', 'text', 'rating', 'created_at']
        read_only_fields = ['customer', 'performer']


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['ad', 'text', 'rating']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class TicketSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    responded_by = UserSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'message', 'creator', 'ad', 'status',
            'response', 'responded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'responded_by', 'response']


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['title', 'message', 'ad']


class TicketResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    status = serializers.ChoiceField(
        choices=Ticket.Status.choices, required=False)


class AssignContractorSerializer(serializers.Serializer):
    contractor_id = serializers.IntegerField()

    def validate_contractor_id(self, value):
        if not User.objects.filter(id=value, role=User.Role.CONTRACTOR).exists():
            raise serializers.ValidationError("Invalid contractor ID")
        return value


class ScheduleSerializer(serializers.Serializer):
    execution_time = serializers.DateTimeField()
    execution_location = serializers.CharField(max_length=255)


class ContractorListSerializer(serializers.ModelSerializer):
    completed_ads_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_comments = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'completed_ads_count', 'average_rating', 'total_comments'
        ]

    def get_completed_ads_count(self, obj):
        return obj.performed_ads.filter(status=Ad.Status.COMPLETED).count()

    def get_average_rating(self, obj):
        avg = obj.received_comments.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 2) if avg else 0

    def get_total_comments(self, obj):
        return obj.received_comments.count()
