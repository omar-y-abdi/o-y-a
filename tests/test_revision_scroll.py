"""Regression checks for the back-to-top test's scroll synchronization."""
import unittest
from unittest.mock import patch

import revision_browser as revision


class ScrollTrace:
    """A sequence of measured offsets, holding its last value when exhausted."""
    def __init__(self, offsets):
        self.offsets = iter(offsets)
        self.current = None
        self.reads = 0

    def evaluate(self, expression):
        if expression != "scrollY":
            raise AssertionError(f"Unexpected browser evaluation: {expression}")
        self.current = next(self.offsets, self.current)
        self.reads += 1
        return self.current


class ScrollWaitTests(unittest.TestCase):
    def setUp(self):
        self.now = 0.0
        clock = patch.object(revision.time, "monotonic", side_effect=lambda: self.now)
        sleep = patch.object(revision.time, "sleep", side_effect=self.advance)
        clock.start()
        sleep.start()
        self.addCleanup(sleep.stop)
        self.addCleanup(clock.stop)

    def advance(self, seconds):
        self.now += seconds

    def test_one_pixel_steps_are_not_settled(self):
        page = ScrollTrace([4, 3, 2, 1, 0, 0, 0, 0])
        self.assertEqual(revision.wait_scroll_settled(page), 0)
        self.assertEqual(page.reads, 8)

    def test_fractional_position_is_not_truncated_to_zero(self):
        page = ScrollTrace([0.75, 0.75, 0.75, 0.75])
        self.assertEqual(revision.wait_scroll_settled(page), 0.75)

    def test_continuous_one_pixel_motion_times_out(self):
        page = ScrollTrace(range(100))
        with self.assertRaises(revision.CheckFailure):
            revision.wait_scroll_settled(page, timeout=0.5)

    def test_top_rejects_a_permanent_one_pixel_offset(self):
        with self.assertRaises(revision.CheckFailure):
            revision.wait_at_top(ScrollTrace([1]), timeout=0.5)

    def test_top_rejects_a_fractional_offset(self):
        with self.assertRaises(revision.CheckFailure):
            revision.wait_at_top(ScrollTrace([0.75]), timeout=0.5)

    def test_top_rejects_rebound_after_touching_zero(self):
        with self.assertRaises(revision.CheckFailure):
            revision.wait_at_top(ScrollTrace([0, 1]), timeout=0.5)

    def test_top_accepts_only_stable_exact_zero(self):
        page = ScrollTrace([3, 2, 1, 0, 0, 0, 0, 0])
        self.assertEqual(revision.wait_at_top(page), 0)


if __name__ == "__main__":
    unittest.main()
