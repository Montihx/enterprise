
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GeneralSettings } from '@/components/dashboard/parsers/tabs/GeneralSettings'
import { GrabbingSettings } from '@/components/dashboard/parsers/tabs/GrabbingSettings'

// Mock toast to avoid errors
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

describe('GeneralSettings Component', () => {
  it('renders API key inputs', () => {
    const mockSave = vi.fn()
    const defaultSettings = { kodik_api_key: '', kodik_api_domain: '', shikimori_api_domain: '' }
    
    render(<GeneralSettings settings={defaultSettings} onSave={mockSave} />)
    
    expect(screen.getByLabelText(/Kodik API Token/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Kodik API Domain/i)).toBeInTheDocument()
  })

  it('toggles switch when clicked', () => {
    const mockSave = vi.fn()
    const defaultSettings = { parse_wa: false }
    
    render(<GeneralSettings settings={defaultSettings} onSave={mockSave} />)
    
    const switchEl = screen.getByRole('switch', { name: /World-Art Data/i })
    expect(switchEl).toHaveAttribute('aria-checked', 'false')
    
    fireEvent.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'true')
  })
})

describe('GrabbingSettings Component', () => {
  it('renders filter checkboxes', () => {
    const mockSave = vi.fn()
    const defaultSettings = { type_tv: true, type_movie: false }
    
    render(<GrabbingSettings settings={defaultSettings} onSave={mockSave} />)
    
    // Check for TV checkbox (checked)
    const tvCheckbox = screen.getByRole('checkbox', { name: /tv/i })
    expect(tvCheckbox).toHaveAttribute('aria-checked', 'true')
    
    // Check for Movie checkbox (unchecked)
    const movieCheckbox = screen.getByRole('checkbox', { name: /movie/i })
    expect(movieCheckbox).toHaveAttribute('aria-checked', 'false')
  })
})
