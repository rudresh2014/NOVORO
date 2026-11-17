
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response({
                'message': 'Registration successful.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'message': 'Username and password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is None:
            return Response({
                'message': 'Invalid username or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                'message': 'This account is inactive.'
            }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)

        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)

        return Response({
            'message': 'Logout successful.'
        })


class ProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            UserSerializer(request.user).data
        )
