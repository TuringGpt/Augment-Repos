"""
DataHub Scraper - Web scraper with optional sitemap-driven URL discovery.

This scraper can discover URLs from sitemaps and merge them with manually
configured target URLs for comprehensive web scraping.
"""

import argparse
import json
from typing import List, Dict, Optional
from sitemap_discoverer import SitemapDiscoverer


class DataHubScraper:
    """
    Web scraper with optional sitemap-driven URL discovery.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the DataHub scraper.
        
        Args:
            config: Configuration dictionary with optional keys:
                - sitemap_url: URL to sitemap for URL discovery
                - target_urls: List of manually configured URLs
                - timeout: Request timeout in seconds (default: 30)
        """
        self.config = config or {}
        self.sitemap_url = self.config.get('sitemap_url')
        self.target_urls = self.config.get('target_urls', [])
        self.timeout = self.config.get('timeout', 30)
        
        self.discoverer = SitemapDiscoverer(timeout=self.timeout) if self.sitemap_url else None
        self.all_urls = []
    
    def discover_urls(self) -> List[str]:
        """
        Discover all URLs to scrape.
        
        Combines sitemap-discovered URLs with configured target URLs.
        
        Returns:
            List of all URLs to scrape
        """
        discovered_urls = set()
        
        # Discover URLs from sitemap if configured
        if self.sitemap_url and self.discoverer:
            print(f"Discovering URLs from sitemap: {self.sitemap_url}")
            try:
                discovered_urls = self.discoverer.discover_urls(self.sitemap_url)
                print(f"Discovered {len(discovered_urls)} URLs from sitemap")
            except Exception as e:
                print(f"Warning: Sitemap discovery failed: {e}")
                print("Continuing with configured target URLs only")
        
        # Merge with configured targets
        if self.target_urls:
            print(f"Merging with {len(self.target_urls)} configured target URLs")
            self.all_urls = self.discoverer.merge_with_configured_targets(
                discovered_urls, self.target_urls
            ) if self.discoverer else sorted(list(set(self.target_urls)))
        else:
            self.all_urls = sorted(list(discovered_urls))
        
        print(f"Total URLs to scrape: {len(self.all_urls)}")
        return self.all_urls
    
    def scrape(self) -> Dict:
        """
        Execute the scraping process.
        
        Returns:
            Dictionary with scraping results
        """
        # Discover URLs
        urls = self.discover_urls()
        
        # Placeholder for actual scraping logic
        # In a real implementation, this would fetch and process each URL
        results = {
            'total_urls': len(urls),
            'urls': urls,
            'status': 'completed'
        }
        
        return results
    
    def print_urls(self):
        """Print all discovered URLs."""
        if not self.all_urls:
            self.discover_urls()
        
        print("\n=== Discovered URLs ===")
        for i, url in enumerate(self.all_urls, 1):
            print(f"{i}. {url}")
        print(f"\nTotal: {len(self.all_urls)} URLs")


def load_config(config_file: str) -> Dict:
    """Load configuration from JSON file."""
    with open(config_file, 'r') as f:
        return json.load(f)


def main():
    """Command-line interface for the scraper."""
    parser = argparse.ArgumentParser(
        description='DataHub Scraper with sitemap-driven URL discovery'
    )
    parser.add_argument(
        '--config',
        type=str,
        help='Path to JSON configuration file'
    )
    parser.add_argument(
        '--sitemap',
        type=str,
        help='URL to sitemap for URL discovery'
    )
    parser.add_argument(
        '--urls',
        type=str,
        nargs='+',
        help='Manually configured target URLs'
    )
    parser.add_argument(
        '--list-urls',
        action='store_true',
        help='List all discovered URLs without scraping'
    )
    
    args = parser.parse_args()
    
    # Load configuration
    if args.config:
        config = load_config(args.config)
    else:
        config = {}
        if args.sitemap:
            config['sitemap_url'] = args.sitemap
        if args.urls:
            config['target_urls'] = args.urls
    
    # Initialize scraper
    scraper = DataHubScraper(config)
    
    # Execute
    if args.list_urls:
        scraper.print_urls()
    else:
        results = scraper.scrape()
        print(f"\nScraping completed: {results['status']}")
        print(f"Processed {results['total_urls']} URLs")


if __name__ == '__main__':
    main()
