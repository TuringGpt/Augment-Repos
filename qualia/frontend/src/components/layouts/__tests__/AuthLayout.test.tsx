import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthLayout } from '@/components/layouts/AuthLayout'

describe('AuthLayout', () => {
  it('keeps the auth shell on a shared secondary background', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthLayout>
          <div>Auth content</div>
        </AuthLayout>
      </MemoryRouter>
    )

    expect(container.querySelector('.min-h-screen')).toHaveClass('bg-secondary')
  })

  it('renders a subtle footer with the current copyright notice', () => {
    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Auth content</div>
        </AuthLayout>
      </MemoryRouter>
    )

    const footer = screen.getByRole('contentinfo')
    const footerText = screen.getByText(/qualia\. all rights reserved\./i)

    expect(footerText).toBeInTheDocument()
    expect(footer).toHaveClass('text-xs')
    expect(footer).toHaveClass('text-muted-foreground/70')
  })
})
