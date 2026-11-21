import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../src/components/ui/Tabs';
import { Switch } from '../src/components/ui/Switch';
import { Toast } from '../src/components/ui/Toast';
import { getProfileUrl } from '../src/lib/utils';

describe('Phase D Design System & UI Components', () => {
  it('generates resilient profile URLs from usernames and IDs', () => {
    expect(getProfileUrl({ username: 'asmitha', id: 'usr-1' })).toBe('/profile/asmitha');
    expect(getProfileUrl({ username: '  Ash  ', id: 'usr-2' })).toBe('/profile/Ash');
    expect(getProfileUrl({ username: '', id: 'usr-3' })).toBe('/profile/usr-3');
    expect(getProfileUrl(null)).toBe('/profile');
    expect(getProfileUrl(undefined)).toBe('/profile');
  });

  it('renders Tabs component and switches active tab on click', () => {
    function TabWrapper() {
      const [active, setActive] = useState('one');
      return (
        <Tabs
          tabs={[
            { id: 'one', label: 'Overview' },
            { id: 'two', label: 'Voyages', badge: 3 },
          ]}
          activeTab={active}
          onChange={setActive}
        />
      );
    }

    render(<TabWrapper />);
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Voyages')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();

    fireEvent.click(screen.getByText('Voyages'));
    expect(screen.getByText('Voyages').closest('button')?.className).toContain('bg-primary');
  });

  it('renders Switch toggle and responds to interaction', () => {
    function SwitchWrapper() {
      const [checked, setChecked] = useState(false);
      return (
        <Switch
          checked={checked}
          onChange={setChecked}
          label="Dark Mode"
          description="Enable dark canvas theme"
        />
      );
    }

    render(<SwitchWrapper />);
    const switchBtn = screen.getByRole('switch');
    expect(switchBtn.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(switchBtn);
    expect(switchBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('renders Toast notification with correct styling and title', () => {
    const handleClose = vi.fn();
    render(
      <Toast
        type="success"
        title="Voyage Launched"
        message="Your crew project is now public."
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Voyage Launched')).toBeDefined();
    expect(screen.getByText('Your crew project is now public.')).toBeDefined();

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
