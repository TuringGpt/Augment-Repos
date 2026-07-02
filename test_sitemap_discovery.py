"""
Unit tests for SitemapDiscoverer.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from sitemap_discoverer import SitemapDiscoverer


class TestSitemapDiscoverer(unittest.TestCase):
    """Test suite for SitemapDiscoverer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.discoverer = SitemapDiscoverer(timeout=10)
    
    def test_initialization(self):
        """Test SitemapDiscoverer initialization."""
        self.assertEqual(self.discoverer.timeout, 10)
        self.assertIsNotNone(self.discoverer.session)
        self.assertIn('User-Agent', self.discoverer.session.headers)
    
    @patch('sitemap_discoverer.requests.Session.get')
    def test_discover_urls_from_urlset(self, mock_get):
        """Test URL discovery from a simple urlset sitemap."""
        # Mock sitemap XML response
        sitemap_xml = b'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://example.com/page1</loc>
    </url>
    <url>
        <loc>https://example.com/page2</loc>
    </url>
    <url>
        <loc>https://example.com/page3</loc>
    </url>
</urlset>'''
        
        mock_response = Mock()
        mock_response.content = sitemap_xml
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        urls = self.discoverer.discover_urls('https://example.com/sitemap.xml')
        
        self.assertEqual(len(urls), 3)
        self.assertIn('https://example.com/page1', urls)
        self.assertIn('https://example.com/page2', urls)
        self.assertIn('https://example.com/page3', urls)
    
    @patch('sitemap_discoverer.requests.Session.get')
    def test_discover_urls_from_sitemap_index(self, mock_get):
        """Test URL discovery from a sitemap index."""
        # Mock sitemap index XML
        index_xml = b'''<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://example.com/sitemap1.xml</loc>
    </sitemap>
    <sitemap>
        <loc>https://example.com/sitemap2.xml</loc>
    </sitemap>
</sitemapindex>'''
        
        # Mock individual sitemap XMLs
        sitemap1_xml = b'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://example.com/page1</loc></url>
</urlset>'''
        
        sitemap2_xml = b'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://example.com/page2</loc></url>
</urlset>'''
        
        def mock_get_response(url, timeout):
            response = Mock()
            response.raise_for_status = Mock()
            if 'sitemap.xml' in url and 'sitemap1' not in url and 'sitemap2' not in url:
                response.content = index_xml
            elif 'sitemap1.xml' in url:
                response.content = sitemap1_xml
            elif 'sitemap2.xml' in url:
                response.content = sitemap2_xml
            return response
        
        mock_get.side_effect = mock_get_response
        
        urls = self.discoverer.discover_urls('https://example.com/sitemap.xml')
        
        self.assertEqual(len(urls), 2)
        self.assertIn('https://example.com/page1', urls)
        self.assertIn('https://example.com/page2', urls)
    
    @patch('sitemap_discoverer.requests.Session.get')
    def test_discover_urls_without_namespace(self, mock_get):
        """Test URL discovery from sitemap without namespace."""
        sitemap_xml = b'''<?xml version="1.0" encoding="UTF-8"?>
<urlset>
    <url>
        <loc>https://example.com/page1</loc>
    </url>
</urlset>'''
        
        mock_response = Mock()
        mock_response.content = sitemap_xml
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        urls = self.discoverer.discover_urls('https://example.com/sitemap.xml')
        
        self.assertEqual(len(urls), 1)
        self.assertIn('https://example.com/page1', urls)
    
    def test_merge_with_configured_targets(self):
        """Test merging discovered URLs with configured targets."""
        discovered = {'https://example.com/page1', 'https://example.com/page2'}
        configured = ['https://example.com/page3', 'https://example.com/page1']  # page1 is duplicate
        
        merged = self.discoverer.merge_with_configured_targets(discovered, configured)
        
        self.assertEqual(len(merged), 3)
        self.assertIn('https://example.com/page1', merged)
        self.assertIn('https://example.com/page2', merged)
        self.assertIn('https://example.com/page3', merged)
        # Should be sorted
        self.assertEqual(merged, sorted(merged))
    
    def test_merge_empty_sets(self):
        """Test merging when one or both sets are empty."""
        # Empty discovered
        merged1 = self.discoverer.merge_with_configured_targets(set(), ['https://example.com/page1'])
        self.assertEqual(merged1, ['https://example.com/page1'])
        
        # Empty configured
        merged2 = self.discoverer.merge_with_configured_targets({'https://example.com/page1'}, [])
        self.assertEqual(merged2, ['https://example.com/page1'])
        
        # Both empty
        merged3 = self.discoverer.merge_with_configured_targets(set(), [])
        self.assertEqual(merged3, [])
    
    @patch('sitemap_discoverer.requests.Session.get')
    def test_handles_request_errors(self, mock_get):
        """Test handling of network errors."""
        mock_get.side_effect = Exception("Network error")
        
        with self.assertRaises(Exception):
            self.discoverer.discover_urls('https://example.com/sitemap.xml')


if __name__ == '__main__':
    unittest.main()
