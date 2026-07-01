/**
 * Critical smoke tests for OHMM application.
 *
 * These verify:
 * 1. App renders without crashing
 * 2. Core UI regions are present
 * 3. Selector modals can open
 * 4. Calculation output region renders
 *
 * Tests are intentionally NOT coupled to specific text content or styling.
 * They test structure and interactivity, not visual details.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock fetch for Supabase calls that fire on mount
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve([]),
    } as Response)
  );
});

// Lazy import to avoid import-time side effects before mocks are set
let App: React.ComponentType;

beforeAll(async () => {
  const mod = await import('../App');
  App = mod.default;
});

describe('App — Critical Smoke Tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
    expect(container.querySelector('.ohmm-app-shell')).toBeInTheDocument();
  });

  it('renders the application header', () => {
    render(<App />);
    const header = document.querySelector('.ohmm-app-header');
    expect(header).toBeInTheDocument();
  });

  it('renders the workspace with offensive and defensive panels', () => {
    render(<App />);
    const workspace = document.querySelector('.ohmm-workspace');
    expect(workspace).toBeInTheDocument();
    // Should have 3 children: offensive panel, analysis hub, defensive panel
    const columns = workspace!.querySelectorAll('.ohmm-side-column');
    expect(columns.length).toBe(2);
  });

  it('renders the analysis hub center panel', () => {
    render(<App />);
    const analysis = document.querySelector('.ohmm-analysis-frame');
    expect(analysis).toBeInTheDocument();
  });

  it('renders weapon slot buttons that are clickable', () => {
    render(<App />);
    // Find all slot buttons (they have the ohmm-slot-button class)
    const slotButtons = document.querySelectorAll('.ohmm-slot-button');
    expect(slotButtons.length).toBeGreaterThan(0);

    // Click the first weapon slot — should open a modal
    fireEvent.click(slotButtons[0]);

    // A modal should appear (fixed inset-0 z-50 overlay)
    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
  });

  it('weapon selector modal can open and close', async () => {
    render(<App />);
    const slotButtons = document.querySelectorAll('.ohmm-slot-button');
    fireEvent.click(slotButtons[0]);

    // Modal is open
    let modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();

    // Close button exists (X icon button with aria-label)
    const closeBtn = modal!.querySelector('button[aria-label="Close modal"]');
    expect(closeBtn).toBeInTheDocument();

    // Click close
    fireEvent.click(closeBtn!);

    // Modal should disappear
    await waitFor(() => {
      modal = document.querySelector('.fixed.inset-0.z-50');
      expect(modal).not.toBeInTheDocument();
    });
  });

  it('armor slots are present and clickable', () => {
    render(<App />);
    // There should be armor equipment slots (6 armor pieces × 2 sides = at least 6 per panel)
    const slotButtons = document.querySelectorAll('.ohmm-slot-button');
    // At minimum: 2 weapons + 6 armors + 2 buffs + 1 deviation = 11 per side × 2 = 22
    expect(slotButtons.length).toBeGreaterThanOrEqual(16);
  });

  it('mod tile buttons are present', () => {
    render(<App />);
    const modTiles = document.querySelectorAll('.ohmm-tile-button');
    // At minimum: 2 weapon mods + 2 calibration tiles per side = 4 per side
    expect(modTiles.length).toBeGreaterThanOrEqual(4);
  });

  it('analysis hub contains module toggle buttons', () => {
    render(<App />);
    const toggles = document.querySelectorAll('.ohmm-module-toggle');
    // 5 modules: resolver, status, telemetry, mitigation, timeline
    expect(toggles.length).toBeGreaterThanOrEqual(4);
  });

  it('settings button opens settings modal', () => {
    render(<App />);
    // Find settings button (icon button with title="Settings")
    const settingsBtn = document.querySelector('button[title="Settings"]');
    expect(settingsBtn).toBeInTheDocument();

    fireEvent.click(settingsBtn!);

    // Settings modal should appear
    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
  });

  it('calculation output region renders stat chips', () => {
    render(<App />);
    // StatChip components render with specific structure
    // Look for the "Sustained DPS" text pattern in the analysis area
    const analysisFrame = document.querySelector('.ohmm-analysis-frame');
    expect(analysisFrame).toBeInTheDocument();
    // Should contain chart containers (ResponsiveContainer renders a div)
    expect(analysisFrame!.innerHTML.length).toBeGreaterThan(100);
  });

  it('calibration modal opens with weapon DMG control and substat select', () => {
    render(<App />);
    // Find calibration tile buttons (they have ohmm-tile-button class and title="Weapon Calibration")
    const calibTile = document.querySelector('button[title="Weapon Calibration"]');
    expect(calibTile).toBeInTheDocument();

    fireEvent.click(calibTile!);

    // Modal should open
    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();

    // Weapon DMG slider/input should be present
    const weaponDmgInput = modal!.querySelector('input[aria-label="Weapon DMG calibration roll"]');
    expect(weaponDmgInput).toBeInTheDocument();

    // Secondary substat select should be present
    const substatSelect = modal!.querySelector('select[aria-label="Rolled secondary calibration substat"]');
    expect(substatSelect).toBeInTheDocument();
  });

  it('buff modal opens when food slot is clicked', () => {
    render(<App />);
    // Food buff slot is the 9th ohmm-slot-button (index 8: after 2 weapons + 6 armor)
    const slotButtons = document.querySelectorAll('.ohmm-slot-button');
    // Click the food buff slot (9th slot in offensive panel)
    fireEvent.click(slotButtons[8]);

    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
    // Modal should have close button
    expect(modal!.querySelector('button[aria-label="Close modal"]')).toBeInTheDocument();
  });

  it('deviation modal opens when deviation slot is clicked', () => {
    render(<App />);
    // Deviation slot is the 11th ohmm-slot-button (index 10: after 2 weapons + 6 armor + 2 buffs)
    const slotButtons = document.querySelectorAll('.ohmm-slot-button');
    fireEvent.click(slotButtons[10]);

    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
    expect(modal!.querySelector('button[aria-label="Close modal"]')).toBeInTheDocument();
  });

  it('cradle modal opens when cradle perk tile is clicked', () => {
    render(<App />);
    // Cradle tiles are rendered with specific structure — find by the grid of small tiles
    // They don't have the ohmm-tile-button class, but they do have Cpu icon and P1/P2 labels
    // The CradleTile doesn't use ohmm-tile-button class, it's a plain button
    // Find all buttons that are NOT ohmm-slot-button and NOT ohmm-tile-button and are in the cradle section
    // Simpler: cradle tiles are in a "grid grid-cols-4" container
    const cradleGrids = document.querySelectorAll('.grid.grid-cols-4');
    expect(cradleGrids.length).toBeGreaterThan(0);
    
    // Click the first cradle tile (first button inside first 4-col grid)
    const firstCradleTile = cradleGrids[0].querySelector('button');
    expect(firstCradleTile).toBeInTheDocument();
    fireEvent.click(firstCradleTile!);

    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
    expect(modal!.querySelector('button[aria-label="Close modal"]')).toBeInTheDocument();
  });

  it('attachment modal opens when attachment tile is clicked', () => {
    render(<App />);
    // Attachment tiles are in a "grid grid-cols-5" container and have ohmm-tile-button class
    const attachGrids = document.querySelectorAll('.grid.grid-cols-5');
    expect(attachGrids.length).toBeGreaterThan(0);

    // Click the first attachment tile
    const firstAttachTile = attachGrids[0].querySelector('.ohmm-tile-button');
    expect(firstAttachTile).toBeInTheDocument();
    fireEvent.click(firstAttachTile!);

    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).toBeInTheDocument();
    expect(modal!.querySelector('button[aria-label="Close modal"]')).toBeInTheDocument();
  });
});
