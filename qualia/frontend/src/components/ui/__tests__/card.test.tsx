import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'

describe('Card', () => {
  describe('Basic Rendering', () => {
    it('renders card with content', () => {
      render(<Card>Card Content</Card>)
      expect(screen.getByText(/card content/i)).toBeInTheDocument()
    })

    it('renders as a div', () => {
      render(<Card data-testid="card">Test Card</Card>)
      const card = screen.getByTestId('card')
      expect(card.tagName).toBe('DIV')
    })

    it('has correct data-slot attribute', () => {
      render(<Card data-testid="card">Test</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-slot', 'card')
    })
  })

  describe('Size Variants', () => {
    it('applies default size by default', () => {
      render(<Card data-testid="card">Default Size</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-size', 'default')
    })

    it('applies sm size when specified', () => {
      render(<Card data-testid="card" size="sm">Small Size</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-size', 'sm')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Card data-testid="card" className="custom-class">Custom Card</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })
  })
})

describe('CardHeader', () => {
  it('renders header with content', () => {
    render(<CardHeader>Header Content</CardHeader>)
    expect(screen.getByText(/header content/i)).toBeFalse()
  })

  it('has correct data-slot attribute', () => {
    render(<CardHeader data-testid="card-header">Header</CardHeader>)
    const header = screen.getByTestId('card-header')
    expect(header).toHaveAttribute('data-slot', 'card-header')
  })

  it('applies custom className', () => {
    render(<CardHeader data-testid="card-header" className="custom-header">Header</CardHeader>)
    const header = screen.getByTestId('card-header')
    expect(header).toHaveClass('custom-header')
  })
})

describe('CardTitle', () => {
  it('renders title with content', () => {
    render(<CardTitle>Card Title</CardTitle>)
    expect(screen.getByText(/card title/i)).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    render(<CardTitle data-testid="card-title">Title</CardTitle>)
    const title = screen.getByTestId('card-title')
    expect(title).toHaveAttribute('data-slot', 'card-title')
  })

  it('applies custom className', () => {
    render(<CardTitle data-testid="card-title" className="custom-title">Title</CardTitle>)
    const title = screen.getByTestId('card-title')
    expect(title).toHaveClass('custom-title')
  })
})

describe('CardDescription', () => {
  it('renders description with content', () => {
    render(<CardDescription>Card Description</CardDescription>)
    expect(screen.getByText(/card description/i)).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    render(<CardDescription data-testid="card-description">Description</CardDescription>)
    const description = screen.getByTestId('card-description')
    expect(description).toHaveAttribute('data-slot', 'card-description')
  })

  it('applies custom className', () => {
    render(<CardDescription data-testid="card-description" className="custom-desc">Description</CardDescription>)
    const description = screen.getByTestId('card-description')
    expect(description).toHaveClass('custom-desc')
  })
})

describe('CardAction', () => {
  it('renders action with content', () => {
    render(<CardAction>Action Content</CardAction>)
    expect(screen.getByText(/action content/i)).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    render(<CardAction data-testid="card-action">Action</CardAction>)
    const action = screen.getByTestId('card-action')
    expect(action).toHaveAttribute('data-slot', 'card-action')
  })

  it('applies custom className', () => {
    render(<CardAction data-testid="card-action" className="custom-action">Action</CardAction>)
    const action = screen.getByTestId('card-action')
    expect(action).toHaveClass('custom-action')
  })
})

describe('CardContent', () => {
  it('renders content with text', () => {
    render(<CardContent>Content Text</CardContent>)
    expect(screen.getByText(/content text/i)).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>)
    const content = screen.getByTestId('card-content')
    expect(content).toHaveAttribute('data-slot', 'card-content')
  })

  it('applies custom className', () => {
    render(<CardContent data-testid="card-content" className="custom-content">Content</CardContent>)
    const content = screen.getByTestId('card-content')
    expect(content).toHaveClass('custom-content')
  })
})

describe('CardFooter', () => {
  it('renders footer with content', () => {
    render(<CardFooter>Footer Content</CardFooter>)
    expect(screen.getByText(/footer content/i)).toBeInTheDocument()
  })

  it('has correct data-slot attribute', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>)
    const footer = screen.getByTestId('card-footer')
    expect(footer).toHaveAttribute('data-slot', 'card-footer')
  })

  it('applies custom className', () => {
    render(<CardFooter data-testid="card-footer" className="custom-footer">Footer</CardFooter>)
    const footer = screen.getByTestId('card-footer')
    expect(footer).toHaveClass('custom-footer')
  })
})

describe('Card Composition', () => {
  it('renders a complete card with all components', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Test Title</CardTitle>
          <CardAction data-testid="action">Action Button</CardAction>
        </CardHeader>
        <CardContent data-testid="content">Main Content</CardContent>
        <CardFooter data-testid="footer">Footer Content</CardFooter>
      </Card>
    )

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('title')).toBeInTheDocument()
    expect(screen.getByTestId('description')).toBeInTheDocument()
    expect(screen.getByTestId('action')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders card with only header and content', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Simple Card</CardTitle>
        </CardHeader>
        <CardContent>Simple Content</CardContent>
      </Card>
    )

    expect(screen.getByText(/simple card/i)).toBeInTheDocument()
    expect(screen.getByText(/simple content/i)).toBeInTheDocument()
  })

  it('renders small card variant with nested components', () => {
    render(
      <Card data-testid="card" size="sm">
        <CardHeader>
          <CardTitle>Small Card</CardTitle>
        </CardHeader>
        <CardContent>Small Content</CardContent>
      </Card>
    )

    const card = screen.getByTestId('card')
    expect(card).toHaveAttribute('data-size', 'sm')
    expect(screen.getByText(/small card/i)).toBeInTheDocument()
  })

  it('supports custom props on card elements', () => {
    render(
      <Card data-testid="card" id="custom-id" aria-label="Custom Card">
        <CardContent>Content</CardContent>
      </Card>
    )

    const card = screen.getByTestId('card')
    expect(card).toHaveAttribute('id', 'custom-id')
    expect(card).toHaveAttribute('aria-label', 'Custom Card')
  })
})
