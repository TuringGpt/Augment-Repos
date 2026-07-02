"""
SitemapDiscoverer - Sitemap-driven URL discovery for web scraping.

This module provides functionality to parse XML sitemap documents (both urlset
and sitemapindex formats) and discover URLs for scraping.
"""

import requests
import xml.etree.ElementTree as ET
from typing import List, Set, Optional
from urllib.parse import urljoin, urlparse


class SitemapDiscoverer:
    """
    Discovers URLs from sitemap XML documents.
    
    Supports both sitemap formats:
    - urlset: Direct list of URLs
    - sitemapindex: References to other sitemaps
    """
    
    # XML namespaces commonly used in sitemaps
    NAMESPACES = {
        'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'
    }
    
    def __init__(self, timeout: int = 30):
        """
        Initialize the SitemapDiscoverer.
        
        Args:
            timeout: Request timeout in seconds (default: 30)
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; SitemapDiscoverer/1.0)'
        })
    
    def discover_urls(self, sitemap_url: str) -> Set[str]:
        """
        Discover all URLs from a sitemap or sitemap index.
        
        Args:
            sitemap_url: URL to the sitemap XML file
            
        Returns:
            Set of discovered URLs
            
        Raises:
            requests.RequestException: If sitemap cannot be fetched
            ET.ParseError: If XML is malformed
        """
        discovered_urls = set()
        
        # Fetch and parse the sitemap
        response = self.session.get(sitemap_url, timeout=self.timeout)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        
        # Check if this is a sitemap index or a urlset
        if self._is_sitemap_index(root):
            # Process sitemap index (contains references to other sitemaps)
            sitemap_urls = self._extract_sitemap_urls(root)
            for sm_url in sitemap_urls:
                discovered_urls.update(self._fetch_urlset(sm_url))
        else:
            # Process direct urlset
            discovered_urls.update(self._extract_urls(root))
        
        return discovered_urls
    
    def _is_sitemap_index(self, root: ET.Element) -> bool:
        """Check if the XML root is a sitemapindex."""
        tag = root.tag
        # Remove namespace if present
        if '}' in tag:
            tag = tag.split('}')[1]
        return tag == 'sitemapindex'
    
    def _extract_sitemap_urls(self, root: ET.Element) -> List[str]:
        """Extract sitemap URLs from a sitemapindex."""
        urls = []
        
        # Try with namespace
        for sitemap in root.findall('.//sm:sitemap/sm:loc', self.NAMESPACES):
            if sitemap.text:
                urls.append(sitemap.text.strip())
        
        # Fallback: try without namespace
        if not urls:
            for sitemap in root.findall('.//sitemap/loc'):
                if sitemap.text:
                    urls.append(sitemap.text.strip())
        
        return urls
    
    def _fetch_urlset(self, sitemap_url: str) -> Set[str]:
        """Fetch and parse a urlset sitemap."""
        try:
            response = self.session.get(sitemap_url, timeout=self.timeout)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            return self._extract_urls(root)
        except Exception as e:
            print(f"Warning: Failed to fetch sitemap {sitemap_url}: {e}")
            return set()
    
    def _extract_urls(self, root: ET.Element) -> Set[str]:
        """Extract URLs from a urlset sitemap."""
        urls = set()
        
        # Try with namespace
        for url in root.findall('.//sm:url/sm:loc', self.NAMESPACES):
            if url.text:
                urls.add(url.text.strip())
        
        # Fallback: try without namespace
        if not urls:
            for url in root.findall('.//url/loc'):
                if url.text:
                    urls.add(url.text.strip())
        
        return urls
    
    def merge_with_configured_targets(
        self, 
        discovered_urls: Set[str], 
        configured_targets: List[str]
    ) -> List[str]:
        """
        Merge discovered URLs with configured target URLs.
        
        Args:
            discovered_urls: URLs discovered from sitemap
            configured_targets: Pre-configured target URLs
            
        Returns:
            Deduplicated list of all URLs (discovered + configured)
        """
        all_urls = set(discovered_urls)
        all_urls.update(configured_targets)
        return sorted(list(all_urls))
