from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import User


class AdminCustomerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        customers = User.objects.filter(
            role='CUSTOMER'
        ).values(
            'id',
            'username',
            'email',
            'date_joined',
            'is_active'
        ).order_by('-date_joined')

        return Response(list(customers))