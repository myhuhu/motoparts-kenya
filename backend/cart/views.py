from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartItemSerializer, CartSerializer


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        cart = get_or_create_cart(request.user)
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        existing = CartItem.objects.filter(cart=cart, product_id=product_id).first()
        if existing:
            data = {"product_id": product_id, "quantity": existing.quantity + quantity}
            serializer = CartItemSerializer(existing, data=data)
        else:
            data = {"product_id": product_id, "quantity": quantity}
            serializer = CartItemSerializer(data=data)

        serializer.is_valid(raise_exception=True)
        serializer.save(cart=cart)
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_item(self, request, pk):
        return CartItem.objects.filter(cart__user=request.user, pk=pk).first()

    def put(self, request, pk):
        item = self.get_item(request, pk)
        if not item:
            return Response({"detail": "Cart item not found."}, status=404)
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, pk):
        item = self.get_item(request, pk)
        if not item:
            return Response({"detail": "Cart item not found."}, status=404)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)
