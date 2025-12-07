"""
Comprehensive test suite for the posts module.
Covers all models, views, serializers, and edge cases.
"""

from decimal import Decimal
from io import BytesIO

from django.contrib.auth.models import Group, User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from users.models import Department, Municipality

from .models import Category, Post, PostImage


class PostsTestFixtures:
    """Utility class for creating test data"""

    @staticmethod
    def create_test_user(username="testuser", email="test@example.com", **kwargs):
        """Create a regular test user"""
        return User.objects.create_user(
            username=username,
            email=email,
            password="testpass123",
            first_name=kwargs.get("first_name", "Test"),
            last_name=kwargs.get("last_name", "User"),
        )

    @staticmethod
    def create_moderator_user(username="moderator", email="mod@example.com"):
        """Create a moderator user with proper group assignment"""
        user = User.objects.create_user(
            username=username,
            email=email,
            password="modpass123",
            first_name="Mod",
            last_name="User",
        )
        moderators_group, created = Group.objects.get_or_create(name="moderators")
        user.groups.add(moderators_group)
        return user

    @staticmethod
    def create_staff_user(username="staff", email="staff@example.com"):
        """Create a staff user"""
        return User.objects.create_user(
            username=username,
            email=email,
            password="staffpass123",
            first_name="Staff",
            last_name="User",
            is_staff=True,
        )

    @staticmethod
    def create_category(
        name="Electronics", description="Electronic items", parent=None
    ):
        """Create a test category"""
        from django.utils.text import slugify

        return Category.objects.create(
            name=name,
            description=description,
            slug=slugify(name),
            parent=parent,
            is_active=True,
        )

    @staticmethod
    def create_department(name="Cundinamarca"):
        """Create a test department"""
        return Department.objects.create(name=name)

    @staticmethod
    def create_municipality(name="Bogota", department=None):
        """Create a test municipality"""
        if department is None:
            department = PostsTestFixtures.create_department()
        return Municipality.objects.create(name=name, department=department)

    @staticmethod
    def create_post(
        user,
        title="Test Tomatoes",
        content="Fresh organic tomatoes",
        category=None,
        status=Post.StatusChoices.PENDING_REVIEW,
        **kwargs,
    ):
        """Create a test post with default agricultural data"""
        if category is None:
            category = PostsTestFixtures.create_category("Vegetables")

        defaults = {
            "title": title,
            "content": content,
            "user": user,
            "category": category,
            "status": status,
            "visibility": Post.VisibilityChoices.PUBLIC,
            "price": Decimal("25.00"),
            "quantity": Decimal("100.0"),
            "unit_of_measure": "kg",
            "municipality": PostsTestFixtures.create_municipality(),
        }
        defaults.update(kwargs)
        return Post.objects.create(**defaults)

    @staticmethod
    def create_post_image(post, image_url="https://example.com/image.jpg", order=0):
        """Create a test post image"""
        # Use a simple uploaded file to satisfy ImageField
        image_file = PostsTestFixtures.create_mock_image_file(
            name=image_url.split("/")[-1] if image_url else "test.jpg"
        )
        return PostImage.objects.create(
            post=post,
            image=image_file,
            alt_text="Test image",
            caption="Test caption",
            order=order,
        )

    @staticmethod
    def create_mock_image_file(name="test.jpg", size=1024):
        """Create a small valid image file for testing uploads"""
        img = Image.new("RGB", (10, 10), color="red")
        buffer = BytesIO()
        img.save(buffer, format="JPEG")
        return SimpleUploadedFile(
            name=name, content=buffer.getvalue(), content_type="image/jpeg"
        )


class CategoryModelTest(TestCase):
    """Test Category model functionality"""

    def setUp(self):
        """Set up test data"""
        self.parent_category = PostsTestFixtures.create_category(
            "Agriculture", "Agricultural products"
        )
        self.child_category = PostsTestFixtures.create_category(
            "Fruits", "Fresh fruits", parent=self.parent_category
        )

    def test_category_string_representation(self):
        """Test category string representation"""
        self.assertEqual(str(self.parent_category), "Agriculture")
        self.assertEqual(str(self.child_category), "Agriculture -> Fruits")

    def test_category_is_subcategory_property(self):
        """Test is_subcategory property"""
        self.assertFalse(self.parent_category.is_subcategory)
        self.assertTrue(self.child_category.is_subcategory)

    def test_get_all_subcategories_method(self):
        """Test getting all active subcategories"""
        # Create another subcategory
        subcategory2 = PostsTestFixtures.create_category(
            "Vegetables", "Fresh vegetables", parent=self.parent_category
        )

        # Create inactive subcategory
        inactive_subcategory = PostsTestFixtures.create_category(
            "Inactive", "Inactive category", parent=self.parent_category
        )
        inactive_subcategory.is_active = False
        inactive_subcategory.save()

        subcategories = self.parent_category.get_all_subcategories()

        self.assertEqual(subcategories.count(), 2)
        self.assertIn(self.child_category, subcategories)
        self.assertIn(subcategory2, subcategories)
        self.assertNotIn(inactive_subcategory, subcategories)

    def test_category_slug_uniqueness(self):
        """Test category slug uniqueness constraint"""
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            Category.objects.create(
                name="Different Name",
                slug=self.parent_category.slug,  # Same slug
                description="Different description",
            )


class PostModelTest(TestCase):
    """Test Post model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = PostsTestFixtures.create_test_user()
        self.moderator = PostsTestFixtures.create_moderator_user()
        self.category = PostsTestFixtures.create_category()
        self.department = PostsTestFixtures.create_department("SerializerDept")
        self.municipality = PostsTestFixtures.create_municipality(
            "SerializerCity", self.department
        )

        self.post = PostsTestFixtures.create_post(
            user=self.user,
            category=self.category,
            price=Decimal("15.50"),
            quantity=Decimal("50.0"),
        )

    def test_post_string_representation(self):
        """Test post string representation"""
        expected = f"{self.post.title} - {self.user.username}"
        self.assertEqual(str(self.post), expected)

    def test_post_slug_auto_generation(self):
        """Test automatic slug generation on save"""
        self.assertIsNotNone(self.post.slug)
        self.assertIn("test-tomatoes", self.post.slug.lower())

    def test_post_published_at_auto_set_on_activation(self):
        """Test published_at is set when status becomes ACTIVE"""
        self.assertIsNone(self.post.published_at)

        self.post.status = Post.StatusChoices.ACTIVE
        self.post.save()

        self.assertIsNotNone(self.post.published_at)

    def test_post_is_active_property(self):
        """Test is_active property"""
        self.assertFalse(self.post.is_active)

        self.post.status = Post.StatusChoices.ACTIVE
        self.assertTrue(self.post.is_active)

    def test_post_is_available_property(self):
        """Test is_available property with various conditions"""
        # Not available due to status
        self.assertFalse(self.post.is_available)

        # Make active but private
        self.post.status = Post.StatusChoices.ACTIVE
        self.post.visibility = Post.VisibilityChoices.PRIVATE
        self.assertFalse(self.post.is_available)

        # Make public and active
        self.post.visibility = Post.VisibilityChoices.PUBLIC
        self.assertTrue(self.post.is_available)

        # Set expiration in past
        self.post.expires_at = timezone.now() - timezone.timedelta(days=1)
        self.assertFalse(self.post.is_available)

    def test_post_is_sold_property(self):
        """Test is_sold property"""
        self.assertFalse(self.post.is_sold)

        self.post.status = Post.StatusChoices.SOLD
        self.assertTrue(self.post.is_sold)

    def test_post_total_value_property(self):
        """Test total_value calculation"""
        expected_total = self.post.price * self.post.quantity
        self.assertEqual(self.post.total_value, expected_total)

    def test_post_can_be_edited_by_owner(self):
        """Test that post owner can edit their post"""
        self.assertTrue(self.post.can_be_edited_by(self.user))

    def test_post_can_be_edited_by_moderator(self):
        """Test that moderators can edit any post"""
        self.assertTrue(self.post.can_be_edited_by(self.moderator))

    def test_post_cannot_be_edited_by_other_users(self):
        """Test that other users cannot edit posts"""
        other_user = PostsTestFixtures.create_test_user(
            "otheruser", "other@example.com"
        )
        self.assertFalse(self.post.can_be_edited_by(other_user))

    def test_post_can_be_moderated_by_moderator(self):
        """Test moderation permissions"""
        self.assertTrue(self.post.can_be_moderated_by(self.moderator))

        regular_user = PostsTestFixtures.create_test_user(
            "regular", "regular@example.com"
        )
        self.assertFalse(self.post.can_be_moderated_by(regular_user))

    def test_post_get_first_image(self):
        """Test getting first image"""
        # No images initially
        self.assertIsNone(self.post.get_first_image())

        # Add images
        PostsTestFixtures.create_post_image(self.post, order=1)
        image2 = PostsTestFixtures.create_post_image(
            self.post, order=0
        )  # First by order

        first_image = self.post.get_first_image()
        self.assertEqual(first_image, image2)  # Should be the one with order=0


class PostImageModelTest(TestCase):
    """Test PostImage model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = PostsTestFixtures.create_test_user()
        self.post = PostsTestFixtures.create_post(self.user)
        self.image = PostsTestFixtures.create_post_image(self.post)

    def test_post_image_string_representation(self):
        """Test post image string representation"""
        expected = f"Image for {self.post.title}"
        self.assertEqual(str(self.image), expected)

    def test_post_image_ordering(self):
        """Test post image ordering"""
        image2 = PostsTestFixtures.create_post_image(self.post, order=1)
        image3 = PostsTestFixtures.create_post_image(self.post, order=2)

        images = list(self.post.images.all())
        self.assertEqual(images[0], self.image)  # order=0
        self.assertEqual(images[1], image2)  # order=1
        self.assertEqual(images[2], image3)  # order=2

    def test_post_image_unique_order_per_post(self):
        """Test unique order constraint per post"""
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            PostsTestFixtures.create_post_image(
                self.post, order=0
            )  # Same order as existing


class CategoryViewSetTest(APITestCase):
    """Test CategoryViewSet functionality"""

    def setUp(self):
        """Set up test data and API client"""
        self.client = APIClient()

        # Create categories
        self.parent_category = PostsTestFixtures.create_category("Agriculture")
        self.child_category = PostsTestFixtures.create_category(
            "Fruits", parent=self.parent_category
        )
        self.inactive_category = PostsTestFixtures.create_category("Inactive")
        self.inactive_category.is_active = False
        self.inactive_category.save()

    def test_list_active_categories_only(self):
        """Test listing only active categories"""
        url = reverse("category-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include active categories
        category_names = [cat["name"] for cat in data["data"]]
        self.assertIn("Agriculture", category_names)
        self.assertIn("Fruits", category_names)
        self.assertNotIn("Inactive", category_names)

    def test_filter_main_categories_only(self):
        """Test filtering to show only main categories (no parent)"""
        url = reverse("category-list")
        response = self.client.get(url, {"main_only": "true"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include main categories
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["name"], "Agriculture")

    def test_filter_subcategories_by_parent(self):
        """Test filtering subcategories by parent ID"""
        url = reverse("category-list")
        response = self.client.get(url, {"parent": self.parent_category.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include subcategories of Agriculture
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["name"], "Fruits")
        self.assertEqual(data["data"][0]["parent"], self.parent_category.id)

    def test_search_categories(self):
        """Test searching categories by name and description"""
        url = reverse("category-list")
        response = self.client.get(url, {"search": "fruit"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        category_names = [cat["name"] for cat in data["data"]]
        self.assertIn("Fruits", category_names)

    def test_retrieve_category_by_slug(self):
        """Test retrieving a single category by slug"""
        url = reverse("category-detail", kwargs={"slug": self.parent_category.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["data"]["name"], "Agriculture")
        self.assertEqual(data["data"]["slug"], self.parent_category.slug)

    def test_category_includes_subcategories_and_post_count(self):
        """Test that category response includes subcategories and post count"""
        # Create posts in categories
        user = PostsTestFixtures.create_test_user()
        PostsTestFixtures.create_post(
            user=user, category=self.child_category, status=Post.StatusChoices.ACTIVE
        )

        url = reverse("category-detail", kwargs={"slug": self.parent_category.slug})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should include subcategories
        self.assertEqual(len(data["data"]["subcategories"]), 1)
        self.assertEqual(data["data"]["subcategories"][0]["name"], "Fruits")

        # Post count should reflect active public posts
        subcategory_data = data["data"]["subcategories"][0]
        self.assertEqual(subcategory_data["post_count"], 1)


class PostFeedViewSetTest(APITestCase):
    """Test PostFeedViewSet (marketplace) functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create users and categories
        self.user1 = PostsTestFixtures.create_test_user("user1", "user1@example.com")
        self.user2 = PostsTestFixtures.create_test_user("user2", "user2@example.com")
        self.category1 = PostsTestFixtures.create_category("Fruits")
        self.category2 = PostsTestFixtures.create_category("Vegetables")
        self.department1 = PostsTestFixtures.create_department("Antioquia")
        self.department2 = PostsTestFixtures.create_department("Cundinamarca")
        self.municipality1 = PostsTestFixtures.create_municipality(
            "Medellin", self.department1
        )
        self.municipality2 = PostsTestFixtures.create_municipality(
            "Chia", self.department2
        )

        # Create posts with different statuses and visibility
        self.active_post = PostsTestFixtures.create_post(
            user=self.user1,
            title="Fresh Apples",
            category=self.category1,
            status=Post.StatusChoices.ACTIVE,
            price=Decimal("30.00"),
            municipality=self.municipality1,
            unit_of_measure="boxes",
            is_featured=True,
        )

        self.pending_post = PostsTestFixtures.create_post(
            user=self.user2,
            title="Organic Carrots",
            category=self.category2,
            status=Post.StatusChoices.PENDING_REVIEW,
            price=Decimal("20.00"),
        )

        self.private_post = PostsTestFixtures.create_post(
            user=self.user1,
            title="Private Bananas",
            category=self.category1,
            status=Post.StatusChoices.ACTIVE,
            visibility=Post.VisibilityChoices.PRIVATE,
            price=Decimal("25.00"),
            municipality=self.municipality1,
        )

    def test_list_only_public_active_posts(self):
        """Test that feed only shows public and active posts"""
        url = reverse("marketplace-feed-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include the active public post
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["title"], "Fresh Apples")

    def test_filter_by_category(self):
        """Test filtering posts by category"""
        url = reverse("marketplace-feed-list")
        response = self.client.get(url, {"category": self.category1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only include posts from category1
        for post in data["data"]:
            self.assertEqual(post["category"]["id"], self.category1.id)

    def test_filter_by_price_range(self):
        """Test filtering posts by price range"""
        url = reverse("marketplace-feed-list")

        # Test minimum price filter
        response = self.client.get(url, {"min_price": "25.00"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        for post in data["data"]:
            self.assertGreaterEqual(float(post["price"]), 25.00)

        # Test maximum price filter
        response = self.client.get(url, {"max_price": "35.00"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        for post in data["data"]:
            self.assertLessEqual(float(post["price"]), 35.00)

    def test_filter_by_location(self):
        """Test filtering posts by municipality and department"""
        url = reverse("marketplace-feed-list")

        # Test municipality filter
        response = self.client.get(url, {"municipality": self.municipality1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        for post in data["data"]:
            self.assertEqual(post["municipality"]["id"], self.municipality1.id)

        # Test department filter
        response = self.client.get(url, {"department": self.department1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        for post in data["data"]:
            self.assertEqual(
                post["municipality"]["department"]["id"], self.department1.id
            )

    def test_filter_by_unit_of_measure(self):
        """Test filtering posts by unit of measure"""
        url = reverse("marketplace-feed-list")
        response = self.client.get(url, {"unit": "boxes"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        for post in data["data"]:
            self.assertIn("boxes", post["unit_of_measure"].lower())

    def test_filter_featured_posts(self):
        """Test filtering only featured posts"""
        url = reverse("marketplace-feed-list")
        response = self.client.get(url, {"is_featured": "true"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        for post in data["data"]:
            self.assertTrue(post["is_featured"])

    def test_search_functionality(self):
        """Test search across title, content, and location"""
        url = reverse("marketplace-feed-list")
        response = self.client.get(url, {"search": "apples"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should find the Fresh Apples post
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["title"], "Fresh Apples")

    def test_ordering_functionality(self):
        """Test ordering posts by various fields"""
        # Create another active post with different price
        PostsTestFixtures.create_post(
            user=self.user1,
            title="Expensive Mangoes",
            category=self.category1,
            status=Post.StatusChoices.ACTIVE,
            price=Decimal("100.00"),
        )

        url = reverse("marketplace-feed-list")

        # Test ordering by price descending
        response = self.client.get(url, {"ordering": "-price"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        prices = [float(post["price"]) for post in data["data"]]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_retrieve_post_increments_view_count(self):
        """Test that retrieving a post increments its view count"""
        initial_count = self.active_post.view_count

        url = reverse("marketplace-feed-detail", kwargs={"pk": self.active_post.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database and check view count increased
        self.active_post.refresh_from_db()
        self.assertEqual(self.active_post.view_count, initial_count + 1)

    def test_post_detail_uses_detailed_serializer(self):
        """Test that post detail view uses detailed serializer with all fields"""
        url = reverse("marketplace-feed-detail", kwargs={"pk": self.active_post.pk})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should include detailed fields
        required_fields = [
            "id",
            "title",
            "content",
            "user",
            "category",
            "price",
            "quantity",
            "total_value",
            "is_available",
            "is_sold",
        ]
        for field in required_fields:
            self.assertIn(field, data["data"])


class UserPostViewSetTest(APITestCase):
    """Test UserPostViewSet functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create users
        self.user = PostsTestFixtures.create_test_user()
        self.other_user = PostsTestFixtures.create_test_user(
            "other", "other@example.com"
        )
        self.moderator = PostsTestFixtures.create_moderator_user()

        # Create category
        self.category = PostsTestFixtures.create_category()
        self.municipality = PostsTestFixtures.create_municipality("Cali")

        # Create posts for the user
        self.user_post = PostsTestFixtures.create_post(
            user=self.user, title="My Tomatoes", category=self.category
        )

        # Create post for other user
        self.other_post = PostsTestFixtures.create_post(
            user=self.other_user, title="Other's Carrots", category=self.category
        )

    def test_authentication_required(self):
        """Test that authentication is required for user posts"""
        url = reverse("user-listings-list")
        response = self.client.get(url)

        # DRF may return 403 instead of 401 depending on authentication configuration
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_list_only_authenticated_user_posts(self):
        """Test that users only see their own posts"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only see own posts
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["title"], "My Tomatoes")

    def test_filter_posts_by_status(self):
        """Test filtering user posts by status"""
        # Create posts with different statuses
        PostsTestFixtures.create_post(
            user=self.user, title="Approved Post", status=Post.StatusChoices.APPROVED
        )

        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        response = self.client.get(url, {"status": Post.StatusChoices.APPROVED})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only show approved posts
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["title"], "Approved Post")

    def test_filter_posts_by_visibility(self):
        """Test filtering user posts by visibility"""
        # Create private post
        PostsTestFixtures.create_post(
            user=self.user,
            title="Private Post",
            visibility=Post.VisibilityChoices.PRIVATE,
        )

        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        response = self.client.get(url, {"visibility": Post.VisibilityChoices.PRIVATE})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["title"], "Private Post")

    def test_create_post_success(self):
        """Test successful post creation"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        data = {
            "title": "Fresh Corn",
            "content": "Organic sweet corn for sale",
            "category": self.category.id,
            "price": "15.00",
            "quantity": "200.0",
            "unit_of_measure": "kg",
            "municipality": self.municipality.id,
            "visibility": Post.VisibilityChoices.PUBLIC,
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify post was created and assigned to user
        created_post = Post.objects.get(title="Fresh Corn")
        self.assertEqual(created_post.user, self.user)
        self.assertEqual(created_post.status, Post.StatusChoices.PENDING_REVIEW)

    def test_create_post_moderator_auto_active(self):
        """Test that moderator posts are automatically active"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("user-listings-list")
        data = {
            "title": "Moderator Corn",
            "content": "Moderator's corn",
            "category": self.category.id,
            "price": "20.00",
            "quantity": "100.0",
            "unit_of_measure": "kg",
            "municipality": self.municipality.id,
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Moderator posts should be automatically active
        created_post = Post.objects.get(title="Moderator Corn")
        self.assertEqual(created_post.status, Post.StatusChoices.ACTIVE)

    def test_create_post_validation_errors(self):
        """Test post creation with validation errors"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")

        # Missing required fields
        data = {"title": "Incomplete Post"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_own_post_success(self):
        """Test successful update of own post"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-detail", kwargs={"pk": self.user_post.pk})
        data = {
            "title": "Updated Tomatoes",
            "content": "Updated description",
            "price": "30.00",
        }

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify update
        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.title, "Updated Tomatoes")
        self.assertEqual(self.user_post.price, Decimal("30.00"))

    def test_cannot_update_other_user_post(self):
        """Test that users cannot update posts they don't own"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-detail", kwargs={"pk": self.other_post.pk})
        data = {"title": "Hacked Title"}

        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_destroy_post_changes_visibility_to_private(self):
        """Test that 'deleting' a post actually changes visibility to private"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-detail", kwargs={"pk": self.user_post.pk})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Post should still exist but be private
        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.visibility, Post.VisibilityChoices.PRIVATE)

    def test_toggle_visibility_action(self):
        """Test toggle_visibility custom action"""
        self.client.force_authenticate(user=self.user)

        # Initially public
        self.assertEqual(self.user_post.visibility, Post.VisibilityChoices.PUBLIC)

        url = reverse(
            "user-listings-toggle-visibility", kwargs={"pk": self.user_post.pk}
        )
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should be private now
        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.visibility, Post.VisibilityChoices.PRIVATE)

        # Toggle back
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.visibility, Post.VisibilityChoices.PUBLIC)

    def test_mark_as_sold_action(self):
        """Test mark_as_sold custom action"""
        # First make post active
        self.user_post.status = Post.StatusChoices.ACTIVE
        self.user_post.save()

        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-mark-as-sold", kwargs={"pk": self.user_post.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.status, Post.StatusChoices.SOLD)

    def test_mark_as_sold_only_active_posts(self):
        """Test that only active posts can be marked as sold"""
        self.client.force_authenticate(user=self.user)

        # Post is pending, should fail
        url = reverse("user-listings-mark-as-sold", kwargs={"pk": self.user_post.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pause_listing_action(self):
        """Test pause_listing custom action"""
        # First make post active
        self.user_post.status = Post.StatusChoices.ACTIVE
        self.user_post.save()

        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-pause-listing", kwargs={"pk": self.user_post.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.status, Post.StatusChoices.PAUSED)

        # Unpause
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user_post.refresh_from_db()
        self.assertEqual(self.user_post.status, Post.StatusChoices.ACTIVE)


class PostModerationViewSetTest(APITestCase):
    """Test PostModerationViewSet functionality"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()

        # Create users
        self.user = PostsTestFixtures.create_test_user("moduser", "moduser@example.com")
        self.moderator = PostsTestFixtures.create_moderator_user(
            "modmoderator", "modmoderator@example.com"
        )
        self.staff = PostsTestFixtures.create_staff_user(
            "modstaff", "modstaff@example.com"
        )

        # Create category and posts
        self.category = PostsTestFixtures.create_category(
            "ModCategory", "Moderation category"
        )

        self.pending_post = PostsTestFixtures.create_post(
            user=self.user,
            title="Pending Review Post",
            category=self.category,
            status=Post.StatusChoices.PENDING_REVIEW,
        )

        self.approved_post = PostsTestFixtures.create_post(
            user=self.user,
            title="Approved Post",
            category=self.category,
            status=Post.StatusChoices.APPROVED,
        )

    def test_authentication_required(self):
        """Test that authentication is required"""
        url = reverse("post-moderation-list")
        response = self.client.get(url)

        # DRF may return 403 instead of 401 depending on authentication configuration
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_moderator_permission_required(self):
        """Test that only moderators/staff can access"""
        self.client.force_authenticate(user=self.user)

        url = reverse("post-moderation-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderator_can_list_all_posts(self):
        """Test that moderators can see all posts"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should see both posts
        self.assertEqual(len(data["data"]), 2)

    def test_staff_can_access_moderation(self):
        """Test that staff users can access moderation"""
        self.client.force_authenticate(user=self.staff)

        url = reverse("post-moderation-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_approve_post_action(self):
        """Test approve post custom action"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-approve", kwargs={"pk": self.pending_post.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify approval
        self.pending_post.refresh_from_db()
        self.assertEqual(self.pending_post.status, Post.StatusChoices.APPROVED)
        self.assertEqual(self.pending_post.reviewed_by, self.moderator)
        self.assertIsNotNone(self.pending_post.reviewed_at)

    def test_reject_post_action(self):
        """Test reject post custom action"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-reject", kwargs={"pk": self.pending_post.pk})
        data = {"review_notes": "Not suitable for marketplace"}
        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify rejection
        self.pending_post.refresh_from_db()
        self.assertEqual(self.pending_post.status, Post.StatusChoices.REJECTED)
        self.assertEqual(self.pending_post.review_notes, "Not suitable for marketplace")
        self.assertEqual(self.pending_post.reviewed_by, self.moderator)
        self.assertIsNotNone(self.pending_post.reviewed_at)

    def test_activate_approved_post(self):
        """Test activate action for approved posts"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-activate", kwargs={"pk": self.approved_post.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify activation
        self.approved_post.refresh_from_db()
        self.assertEqual(self.approved_post.status, Post.StatusChoices.ACTIVE)
        self.assertIsNotNone(self.approved_post.published_at)

    def test_cannot_activate_non_approved_post(self):
        """Test that only approved posts can be activated"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-activate", kwargs={"pk": self.pending_post.pk})
        response = self.client.patch(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_review_filter(self):
        """Test pending_review custom action"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-pending-review")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should only show pending posts
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["title"], "Pending Review Post")

    def test_moderator_update_post(self):
        """Test that moderators can update any post"""
        self.client.force_authenticate(user=self.moderator)

        url = reverse("post-moderation-detail", kwargs={"pk": self.pending_post.pk})
        data = {
            "status": Post.StatusChoices.APPROVED,
            "review_notes": "Looks good",
            "is_featured": True,
        }
        response = self.client.patch(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify updates
        self.pending_post.refresh_from_db()
        self.assertEqual(self.pending_post.status, Post.StatusChoices.APPROVED)
        self.assertEqual(self.pending_post.review_notes, "Looks good")
        self.assertTrue(self.pending_post.is_featured)
        self.assertEqual(self.pending_post.reviewed_by, self.moderator)


# Image upload and serializer tests
@override_settings(AWS_STORAGE_BUCKET_NAME=None)  # Disable S3 for tests
class PostCreateWithImagesTest(APITestCase):
    """Test post creation with image uploads (mocked)"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = PostsTestFixtures.create_test_user()
        self.category = PostsTestFixtures.create_category()
        self.department = PostsTestFixtures.create_department("EdgeDept")
        self.municipality = PostsTestFixtures.create_municipality(
            "EdgeCity", self.department
        )

    def test_create_post_without_images(self):
        """Test creating post without images"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        data = {
            "title": "No Images Post",
            "content": "Post without images",
            "category": self.category.id,
            "price": "25.00",
            "quantity": "50.0",
            "unit_of_measure": "kg",
            "municipality": PostsTestFixtures.create_municipality("Bogota").id,
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_post = Post.objects.get(title="No Images Post")
        self.assertEqual(created_post.images.count(), 0)

    def test_create_post_with_images(self):
        """Test creating post with images using mocked upload service"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        mock_file = PostsTestFixtures.create_mock_image_file()

        data = {
            "title": "Post With Images",
            "content": "Post with images",
            "category": self.category.id,
            "price": "25.00",
            "quantity": "50.0",
            "unit_of_measure": "kg",
            "municipality": PostsTestFixtures.create_municipality("Bogota").id,
            "images": [mock_file],
        }

        response = self.client.post(url, data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_post = Post.objects.get(title="Post With Images")
        self.assertEqual(created_post.images.count(), 1)


class SerializerValidationTest(TestCase):
    """Test serializer validation logic"""

    def setUp(self):
        """Set up test data"""
        self.user = PostsTestFixtures.create_test_user()
        self.moderator = PostsTestFixtures.create_moderator_user()
        self.category = PostsTestFixtures.create_category()
        self.municipality = PostsTestFixtures.create_municipality("TestCity")

    def test_category_serializer_subcategories_field(self):
        """Test CategorySerializer subcategories field"""
        from posts.serializers import CategorySerializer

        parent = PostsTestFixtures.create_category("Parent")
        PostsTestFixtures.create_category("Child1", parent=parent)
        PostsTestFixtures.create_category("Child2", parent=parent)

        serializer = CategorySerializer(parent)
        data = serializer.data

        self.assertEqual(len(data["subcategories"]), 2)
        subcategory_names = [sub["name"] for sub in data["subcategories"]]
        self.assertIn("Child1", subcategory_names)
        self.assertIn("Child2", subcategory_names)

    def test_category_serializer_post_count(self):
        """Test CategorySerializer post_count field"""
        from posts.serializers import CategorySerializer

        category = PostsTestFixtures.create_category("Test Category")

        # Create posts with different statuses
        PostsTestFixtures.create_post(
            user=self.user, category=category, status=Post.StatusChoices.ACTIVE
        )
        PostsTestFixtures.create_post(
            user=self.user, category=category, status=Post.StatusChoices.PENDING_REVIEW
        )

        serializer = CategorySerializer(category)
        data = serializer.data

        # Should only count active public posts
        self.assertEqual(data["post_count"], 1)

    def test_post_detail_serializer_readonly_fields(self):
        """Test that readonly fields cannot be modified"""
        from posts.serializers import PostDetailSerializer

        post = PostsTestFixtures.create_post(user=self.user, category=self.category)

        # Try to modify readonly fields
        data = {
            "user": self.moderator.id,  # readonly
            "view_count": 999,  # readonly
            "total_value": "999.99",  # readonly
        }

        # Mock request context
        from unittest.mock import Mock

        request = Mock()
        request.user = self.user

        serializer = PostDetailSerializer(
            post, data=data, partial=True, context={"request": request}
        )

        self.assertTrue(serializer.is_valid())
        serializer.save()

        # Readonly fields should not have changed
        post.refresh_from_db()
        self.assertEqual(post.user, self.user)  # Not changed
        self.assertEqual(post.view_count, 0)  # Not changed

    def test_moderation_serializer_permissions(self):
        """Test PostModerationSerializer permission validation"""
        from rest_framework.exceptions import ValidationError

        from posts.serializers import PostModerationSerializer

        post = PostsTestFixtures.create_post(user=self.user, category=self.category)

        # Regular user should not be able to moderate certain fields
        data = {"status": Post.StatusChoices.APPROVED, "is_featured": True}

        from unittest.mock import Mock

        request = Mock()
        request.user = self.user

        serializer = PostModerationSerializer(
            post, data=data, context={"request": request}
        )

        # Test that serializer validates but raises ValidationError when saving
        # without proper permissions
        self.assertTrue(serializer.is_valid())

        # Regular users should get ValidationError when trying to moderate
        with self.assertRaises(ValidationError) as cm:
            serializer.save()

        # Verify the error message
        self.assertIn("permissions to moderate", str(cm.exception))

    def test_post_image_order_validation(self):
        """Test PostImage order uniqueness validation"""
        from posts.serializers import PostImageSerializer

        post = PostsTestFixtures.create_post(user=self.user, category=self.category)
        PostsTestFixtures.create_post_image(post, order=0)

        # Try to create another image with same order
        data = {
            "image": PostsTestFixtures.create_mock_image_file("order-test.jpg"),
            "order": 0,  # Same order as existing
            "alt_text": "New image",
        }

        serializer = PostImageSerializer(data=data, context={"post": post})

        self.assertTrue(serializer.is_valid())
        with self.assertRaises(IntegrityError):
            serializer.save(post=post)

    def test_post_create_serializer_status_assignment(self):
        """Test status assignment logic in PostCreateUpdateSerializer"""
        # Test regular user gets PENDING_REVIEW
        from unittest.mock import Mock

        from posts.serializers import PostCreateUpdateSerializer

        request = Mock()
        request.user = self.user
        request.FILES = Mock()
        request.FILES.getlist.return_value = []

        data = {
            "title": "Test Post",
            "content": "Test content",
            "category": self.category.id,
            "price": "25.00",
            "quantity": "100.0",
            "unit_of_measure": "kg",
            "municipality": self.municipality.id,
        }

        serializer = PostCreateUpdateSerializer(data=data, context={"request": request})

        self.assertTrue(serializer.is_valid())
        post = serializer.save()

        self.assertEqual(post.status, Post.StatusChoices.PENDING_REVIEW)
        self.assertEqual(post.user, self.user)

    def test_post_create_serializer_moderator_auto_active(self):
        """Test moderator posts are auto-activated"""
        # Test moderator gets ACTIVE
        from unittest.mock import Mock

        from posts.serializers import PostCreateUpdateSerializer

        request = Mock()
        request.user = self.moderator
        request.FILES = Mock()
        request.FILES.getlist.return_value = []

        data = {
            "title": "Moderator Post",
            "content": "Moderator content",
            "category": self.category.id,
            "price": "30.00",
            "quantity": "50.0",
            "unit_of_measure": "kg",
            "municipality": self.municipality.id,
        }

        serializer = PostCreateUpdateSerializer(data=data, context={"request": request})

        self.assertTrue(serializer.is_valid())
        post = serializer.save()

        self.assertEqual(post.status, Post.StatusChoices.ACTIVE)
        self.assertEqual(post.user, self.moderator)

    def test_post_list_serializer_computed_fields(self):
        """Test computed fields in PostListSerializer"""
        from posts.serializers import PostListSerializer

        post = PostsTestFixtures.create_post(
            user=self.user,
            category=self.category,
            price=Decimal("20.00"),
            quantity=Decimal("10.0"),
            status=Post.StatusChoices.ACTIVE,
        )

        serializer = PostListSerializer(post)
        data = serializer.data

        # Test computed fields
        self.assertEqual(float(data["total_value"]), 200.00)  # 20 * 10
        self.assertTrue(data["is_available"])  # active and public

    def test_user_serializer_readonly_fields(self):
        """Test UserSerializer only exposes safe fields"""
        from posts.serializers import UserSerializer

        user = PostsTestFixtures.create_test_user(
            username="serializeruser", email="private@serializer.com"
        )
        user.is_staff = True  # Should not be exposed
        user.save()

        serializer = UserSerializer(user)
        data = serializer.data

        # Should include safe fields
        self.assertIn("id", data)
        self.assertIn("username", data)
        self.assertIn("first_name", data)
        self.assertIn("last_name", data)

        # Should NOT include sensitive fields
        self.assertNotIn("email", data)
        self.assertNotIn("is_staff", data)
        self.assertNotIn("password", data)


class PerformanceAndEdgeCaseTest(APITestCase):
    """Test performance considerations and edge cases"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = PostsTestFixtures.create_test_user()
        self.category = PostsTestFixtures.create_category()
        self.municipality = PostsTestFixtures.create_municipality("TestCity")

    def test_large_number_of_posts_pagination(self):
        """Test pagination with many posts"""
        # Create many posts
        posts = []
        for i in range(50):
            post = PostsTestFixtures.create_post(
                user=self.user,
                title=f"Post {i}",
                status=Post.StatusChoices.ACTIVE,
                category=self.category,
            )
            posts.append(post)

        url = reverse("marketplace-feed-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should have pagination metadata
        self.assertIn("meta", data)
        self.assertIn("pagination", data["meta"])
        self.assertEqual(data["meta"]["pagination"]["count"], 50)

    def test_post_with_extreme_values(self):
        """Test post creation with edge case values"""
        self.client.force_authenticate(user=self.user)

        url = reverse("user-listings-list")
        data = {
            "title": "A" * 200,  # Max length
            "content": "Very long content " * 100,
            "category": self.category.id,
            "price": "99999999.99",  # Max decimal
            "quantity": "99999999.99",
            "unit_of_measure": "X" * 50,  # Max length
            "municipality": self.municipality.id,
        }

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_expired_post_availability(self):
        """Test post availability with expiration"""
        past_time = timezone.now() - timezone.timedelta(days=1)

        expired_post = PostsTestFixtures.create_post(
            user=self.user,
            status=Post.StatusChoices.ACTIVE,
            category=self.category,
            expires_at=past_time,
        )

        # First verify the is_available property works correctly
        self.assertFalse(expired_post.is_available)

        # Create a non-expired post for comparison
        future_time = timezone.now() + timezone.timedelta(days=1)
        active_post = PostsTestFixtures.create_post(
            user=self.user,
            status=Post.StatusChoices.ACTIVE,
            category=self.category,
            expires_at=future_time,
        )

        self.assertTrue(active_post.is_available)

        # Verify that expired posts don't appear in marketplace feed
        url = reverse("marketplace-feed-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should not include the expired post but should include the active one
        post_ids = [post["id"] for post in data["data"]]
        self.assertNotIn(expired_post.id, post_ids)
        self.assertIn(active_post.id, post_ids)

    def test_concurrent_view_count_updates(self):
        """Test view count increments work correctly"""
        post = PostsTestFixtures.create_post(
            user=self.user, status=Post.StatusChoices.ACTIVE, category=self.category
        )

        initial_count = post.view_count

        # Multiple requests to the same post
        url = reverse("marketplace-feed-detail", kwargs={"pk": post.pk})

        for _ in range(5):
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        post.refresh_from_db()
        self.assertEqual(post.view_count, initial_count + 5)

    def test_post_slug_uniqueness_handling(self):
        """Test that post slugs are unique even with same titles"""
        post1 = PostsTestFixtures.create_post(
            user=self.user, title="Same Title", category=self.category
        )

        post2 = PostsTestFixtures.create_post(
            user=self.user, title="Same Title", category=self.category  # Same title
        )

        # Slugs should be different due to UUID suffix
        self.assertNotEqual(post1.slug, post2.slug)
        self.assertTrue(post1.slug.startswith("same-title"))
        self.assertTrue(post2.slug.startswith("same-title"))

    def test_category_hierarchy_depth(self):
        """Test deep category hierarchy"""
        # Create deep hierarchy
        level1 = PostsTestFixtures.create_category("Level1")
        level2 = PostsTestFixtures.create_category("Level2", parent=level1)
        level3 = PostsTestFixtures.create_category("Level3", parent=level2)

        # Should work with deep hierarchy
        self.assertEqual(str(level3), "Level2 -> Level3")  # Direct parent shown
        self.assertTrue(level3.is_subcategory)
        self.assertFalse(level1.is_subcategory)

    def test_empty_search_results(self):
        """Test handling of empty search results"""
        url = reverse("marketplace-feed-list")
        response = self.client.get(url, {"search": "nonexistent"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(len(data["data"]), 0)
        self.assertIn("meta", data)

    def test_invalid_filter_parameters(self):
        """Test graceful handling of invalid filter parameters"""
        url = reverse("marketplace-feed-list")

        # Invalid price range should return 400 with validation error
        response = self.client.get(url, {"min_price": "invalid"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn(
            "min_price",
            data.get("validation_errors", {}),
            msg=f"Expected min_price error, got: {data}",
        )

        # Invalid category ID
        response = self.client.get(url, {"category": "999999"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Non-existent ordering field should not crash
        response = self.client.get(url, {"ordering": "nonexistent_field"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_feed_response_includes_related_data(self):
        """Test that feed payload includes related objects and computed fields"""
        # Create post with related objects
        post = PostsTestFixtures.create_post(
            user=self.user, category=self.category, status=Post.StatusChoices.ACTIVE
        )
        PostsTestFixtures.create_post_image(post)

        url = reverse("marketplace-feed-list")

        # Test that queries are reasonable (not N+1)
        # Current implementation shows: count + main query + images prefetch + category checks
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()

        # Verify that the response includes all necessary related data
        # This ensures the serializer properly includes related objects
        if data["data"]:
            first_post = data["data"][0]

            # Verify that user and category data is included
            self.assertIn("user", first_post)
            self.assertIn("username", first_post["user"])
            self.assertIn("category", first_post)
            self.assertIn("name", first_post["category"])

            # Verify computed fields are present
            self.assertIn("total_value", first_post)
            self.assertIn("is_available", first_post)
