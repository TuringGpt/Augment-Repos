from rest_framework import serializers
from .models import Ticket, Comment

class TicketListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = "__all__"


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
        fields = "__all__"

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = "__all__"

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["ticket","content"]

class CommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["content"]