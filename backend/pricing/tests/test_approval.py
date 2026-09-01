"""✓ Admin approval works"""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from pricing.apply_service import apply_admin_approved_price, reject_pending_approval
from pricing.models import PendingPriceApproval, PriceChangeHistory

from .factories import make_admin_user, make_non_admin_user, make_product


def _make_pending_approval(product, current_price=Decimal('10000.00'), suggested_price=Decimal('5000.00')):
    return PendingPriceApproval.objects.create(
        product=product, current_price=current_price, suggested_price=suggested_price,
        change_percent=Decimal('-50.00'), lowest_competitor_price=suggested_price,
        reason='Decrease exceeds max allowed', status=PendingPriceApproval.PENDING,
    )


class ApplyAdminApprovedPriceTests(TestCase):
    def setUp(self):
        self.admin = make_admin_user()
        self.product = make_product(name='Approval Test Product', price=Decimal('10000.00'))
        self.approval = _make_pending_approval(self.product)

    def test_approve_applies_price_and_creates_history(self):
        history = apply_admin_approved_price(self.approval, self.admin)

        self.product.refresh_from_db()
        self.assertEqual(self.product.discount_price, Decimal('5000.00'))
        self.assertEqual(history.old_price, Decimal('10000.00'))
        self.assertEqual(history.new_price, Decimal('5000.00'))
        self.assertEqual(history.update_type, PriceChangeHistory.MANUAL_APPROVED)
        self.assertIn('Manually approved', history.reason)

        self.approval.refresh_from_db()
        self.assertEqual(self.approval.status, PendingPriceApproval.APPROVED)
        self.assertEqual(self.approval.reviewed_by, self.admin)
        self.assertIsNotNone(self.approval.reviewed_at)

    def test_reject_leaves_price_untouched_and_records_reason(self):
        reject_pending_approval(self.approval, self.admin, rejection_reason='Looks like a pricing error on Amazon')

        self.product.refresh_from_db()
        self.assertEqual(self.product.discount_price, Decimal('10000.00'))
        self.assertEqual(PriceChangeHistory.objects.filter(product=self.product).count(), 0)

        self.approval.refresh_from_db()
        self.assertEqual(self.approval.status, PendingPriceApproval.REJECTED)
        self.assertEqual(self.approval.rejection_reason, 'Looks like a pricing error on Amazon')

    def test_cannot_approve_an_already_approved_row(self):
        apply_admin_approved_price(self.approval, self.admin)
        with self.assertRaises(ValueError):
            apply_admin_approved_price(self.approval, self.admin)

    def test_cannot_reject_an_already_rejected_row(self):
        reject_pending_approval(self.approval, self.admin)
        with self.assertRaises(ValueError):
            reject_pending_approval(self.approval, self.admin)

    def test_cannot_approve_an_already_rejected_row(self):
        reject_pending_approval(self.approval, self.admin)
        with self.assertRaises(ValueError):
            apply_admin_approved_price(self.approval, self.admin)


class PendingPriceApprovalAPITests(TestCase):
    def setUp(self):
        self.admin = make_admin_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.product = make_product(name='API Approval Product', price=Decimal('20000.00'))
        self.approval = _make_pending_approval(self.product, current_price=Decimal('20000.00'), suggested_price=Decimal('12000.00'))

    def test_list_pending_approvals(self):
        resp = self.client.get('/api/pricing/pending-approvals/', {'status': 'pending'})
        self.assertEqual(resp.status_code, 200)

    def test_approve_via_api_applies_price(self):
        resp = self.client.post(f'/api/pricing/pending-approvals/{self.approval.id}/approve/')
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data['status'], 'approved')

        self.product.refresh_from_db()
        self.assertEqual(self.product.discount_price, Decimal('12000.00'))

    def test_reject_via_api_leaves_price_untouched(self):
        resp = self.client.post(
            f'/api/pricing/pending-approvals/{self.approval.id}/reject/',
            {'rejection_reason': 'Competitor price looked wrong'},
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data['status'], 'rejected')
        self.assertEqual(resp.data['rejection_reason'], 'Competitor price looked wrong')

        self.product.refresh_from_db()
        self.assertEqual(self.product.discount_price, Decimal('20000.00'))

    def test_double_approve_via_api_returns_400_not_500(self):
        first = self.client.post(f'/api/pricing/pending-approvals/{self.approval.id}/approve/')
        self.assertEqual(first.status_code, 200)
        second = self.client.post(f'/api/pricing/pending-approvals/{self.approval.id}/approve/')
        self.assertEqual(second.status_code, 400)

    def test_non_admin_cannot_approve(self):
        buyer = make_non_admin_user()
        client = APIClient()
        client.force_authenticate(user=buyer)
        resp = client.post(f'/api/pricing/pending-approvals/{self.approval.id}/approve/')
        self.assertEqual(resp.status_code, 403)

        self.product.refresh_from_db()
        self.assertEqual(self.product.discount_price, Decimal('20000.00'))
