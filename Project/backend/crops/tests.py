from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Crop, Product


class CropsAPITest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", email="u1@example.com", password="pass"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="u2@example.com", password="pass"
        )

        self.product = Product.objects.create(name="Tomato")

        self.client = APIClient()

    def test_create_list_retrieve_update_delete_flow(self):
        # Authenticate as user1 and create a crop via API
        self.client.force_authenticate(user=self.user1)

        payload = {
            "product": self.product.product_id,
            "start_date": "2025-01-01",
            "harvest_date": "2025-06-01",
            "area": 1.5,
            "crop_type": "Hybrid",
            "fertilizer_type": "organic",
            "production_qty": 100.0,
            "irrigation_method": "drip",
            "notes": "Test crop",
        }

        resp = self.client.post("/api/crops/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        # Verify crop created and owned by user1
        data = resp.data
        crop_id = data.get("crop_id")
        self.assertIsNotNone(crop_id)
        self.assertEqual(data.get("user_id"), self.user1.id)
        self.assertTrue(Crop.objects.filter(crop_id=crop_id).exists())

        # List should return only user1's crops
        list_resp = self.client.get("/api/crops/")
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        list_data = list_resp.data
        # handle pagination
        results = list_data.get(
            "results", list_data if isinstance(list_data, list) else []
        )
        self.assertTrue(any(item.get("crop_id") == crop_id for item in results))

        # Retrieve
        retrieve_resp = self.client.get(f"/api/crops/{crop_id}/")
        self.assertEqual(retrieve_resp.status_code, status.HTTP_200_OK)

        # Update (patch)
        patch_resp = self.client.patch(
            f"/api/crops/{crop_id}/", {"area": 3.5}, format="json"
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Crop.objects.get(crop_id=crop_id).area, 3.5)

        # Another user should not be able to access this crop
        self.client.force_authenticate(user=self.user2)
        forbidden_resp = self.client.get(f"/api/crops/{crop_id}/")
        # ViewSet queryset is filtered by owner, so non-owner should get 404
        self.assertIn(
            forbidden_resp.status_code,
            (status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN),
        )

        # Non-owner delete should fail
        del_resp = self.client.delete(f"/api/crops/{crop_id}/")
        self.assertIn(
            del_resp.status_code, (status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN)
        )

        # Owner can delete
        self.client.force_authenticate(user=self.user1)
        owner_del = self.client.delete(f"/api/crops/{crop_id}/")
        self.assertIn(
            owner_del.status_code,
            (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK, status.HTTP_202_ACCEPTED),
        )
        self.assertFalse(Crop.objects.filter(crop_id=crop_id).exists())

    def test_list_shows_only_owner_records(self):
        # create a crop for user2 directly
        Crop.objects.create(
            user=self.user2,
            product=self.product,
            start_date="2025-01-01",
            harvest_date="2025-06-01",
            area=2.0,
            crop_type="Local",
            fertilizer_type="none",
            production_qty=50.0,
            irrigation_method="gravity",
            notes="other user",
        )

        # create a crop for user1
        Crop.objects.create(
            user=self.user1,
            product=self.product,
            start_date="2025-02-01",
            harvest_date="2025-07-01",
            area=1.0,
            crop_type="Local",
            fertilizer_type="none",
            production_qty=20.0,
            irrigation_method="gravity",
            notes="my crop",
        )

        self.client.force_authenticate(user=self.user1)
        resp = self.client.get("/api/crops/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data
        results = data.get("results", data if isinstance(data, list) else [])
        # only one record should match user1
        self.assertTrue(any(r.get("user_id") == self.user1.id for r in results))
        self.assertFalse(any(r.get("user_id") == self.user2.id for r in results))

    def test_notes_word_limit_exceeded(self):
        # Ensure creating a crop with more than 255 words in notes fails
        self.client.force_authenticate(user=self.user1)

        long_notes = "word " * 256
        payload = {
            "product": self.product.product_id,
            "start_date": "2025-01-01",
            "harvest_date": "2025-06-01",
            "area": 1.5,
            "crop_type": "Hybrid",
            "fertilizer_type": "organic",
            "production_qty": 100.0,
            "irrigation_method": "drip",
            "notes": long_notes,
        }

        resp = self.client.post("/api/crops/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        # Ensure the error message indicates the notes exceed the word limit
        data = resp.data
        errors = data.get("validation_errors") or data
        self.assertIn("notes", errors)
        self.assertTrue(
            any("Máximo" in str(m) or "255" in str(m) for m in errors["notes"])
        )

    def test_crop_type_word_limit_exceeded(self):
        # Ensure creating a crop with more than 10 words in crop_type fails
        self.client.force_authenticate(user=self.user1)

        long_crop_type = "type " * 11
        payload = {
            "product": self.product.product_id,
            "start_date": "2025-01-01",
            "harvest_date": "2025-06-01",
            "area": 1.5,
            "crop_type": long_crop_type,
            "fertilizer_type": "organic",
            "production_qty": 100.0,
            "irrigation_method": "drip",
            "notes": "ok",
        }

        resp = self.client.post("/api/crops/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        data = resp.data
        errors = data.get("validation_errors") or data
        self.assertIn("crop_type", errors)
        self.assertTrue(
            any("Máximo" in str(m) or "10" in str(m) for m in errors["crop_type"])
        )
