from rest_framework import serializers
from .models import Ticket, Comment

class TicketListSerializer(serializers.ModelSerializer):
    comment_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Ticket
        fields = ["id", "title", "description", "status", "priority", "assignee", "reporter", "created_at", "comment_count"]


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["title", "description", "status", "priority", "assignee"]


class TicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["title", "description", "status", "priority", "assignee"]

class TicketDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ["id", "title", "description", "status", "priority", "assignee", "reporter", "created_at", "updated_at"]

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "ticket", "user", "content", "created_at", "updated_at"]

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["ticket","content"]
        read_only_fields = ["ticket"]

class CommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["content"]