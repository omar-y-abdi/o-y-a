import unittest

from card_export import render_state_ready, should_check_layout


class CardExportReadinessTests(unittest.TestCase):
    def test_hidden_shadow_surface_is_ready_once_expected_text_is_rendered(self):
        state = {
            'shadowReady': True,
            'text': 'Expected card',
            'host': {'width': 0, 'height': 0},
            'contentBox': {'width': 0, 'height': 0},
        }
        self.assertTrue(render_state_ready(state, 'Expected card'))
        self.assertFalse(should_check_layout(state))

    def test_visible_surface_keeps_geometry_validation_enabled(self):
        state = {
            'shadowReady': True,
            'text': 'Expected card',
            'host': {'width': 316, 'height': 210},
            'contentBox': {'width': 316, 'height': 210},
        }
        self.assertTrue(render_state_ready(state, 'Expected card'))
        self.assertTrue(should_check_layout(state))

    def test_wrong_or_unrendered_text_is_not_ready(self):
        self.assertFalse(render_state_ready(None, 'Expected card'))
        self.assertFalse(render_state_ready({'shadowReady': False, 'text': 'Expected card'}, 'Expected card'))
        self.assertFalse(render_state_ready({'shadowReady': True, 'text': 'Other card'}, 'Expected card'))


if __name__ == '__main__':
    unittest.main()
