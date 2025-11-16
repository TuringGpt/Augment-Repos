from django.db import models

# Create your models here.
class Ticket(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=255)
    priority = models.CharField(max_length=255)
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_tickets')

class Comment(BaseModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
