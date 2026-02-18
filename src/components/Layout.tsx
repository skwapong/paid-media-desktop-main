import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSettingsStore } from '../stores/settingsStore'

// Left sidebar nav items (different products - not focus of prototype)
const navItems = [
  { path: '/campaign-chat', label: 'Home', icon: <img src="/icons/nav-home.svg" alt="Home" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/favorites', label: 'Favorites', icon: <img src="/icons/nav-favorites.svg" alt="Favorites" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/data', label: 'Data', icon: <img src="/icons/nav-data.svg" alt="Data" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/campaigns', label: 'Campaigns', icon: <img src="/icons/nav-campaigns.svg" alt="Campaigns" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/audiences', label: 'Audiences', icon: <img src="/icons/nav-audiences.svg" alt="Audiences" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/content-spots', label: 'Content', icon: <img src="/icons/nav-content.svg" alt="Content" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/targeting', label: 'Targeting', icon: <img src="/icons/nav-targeting.svg" alt="Targeting" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/publish', label: 'Publish', icon: <img src="/icons/nav-publish.svg" alt="Publish" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
  { path: '/templates', label: 'Templates', icon: <img src="/icons/nav-templates.svg" alt="Templates" className="h-10 w-auto transition-all group-hover:brightness-50" /> },
]

const bottomNavItems = [
  { path: '/settings', label: 'Settings', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

// Top navigation items (paid media navigation)
const topNavItems = [
  { path: '/campaign-chat', label: 'Campaign Chat', isIcon: true, icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )},
  { path: '/campaigns', label: 'Campaigns', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { path: '/optimize', label: 'Optimize', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )},
  { path: '/reports', label: 'Reports', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
]

console.log('📐 Layout component loaded');

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isChat = location.pathname === '/campaign-chat'
  const parentSegments = useSettingsStore((s) => s.parentSegments)
  const selectedParentSegment = useSettingsStore((s) => s.selectedParentSegmentId)
  const isLoadingParentSegments = useSettingsStore((s) => s.isLoadingParentSegments)
  const parentSegmentError = useSettingsStore((s) => s.parentSegmentError)
  const fetchParentSegments = useSettingsStore((s) => s.fetchParentSegments)
  const storeSelectParentSegment = useSettingsStore((s) => s.selectParentSegment)
  const [showParentSegmentDropdown, setShowParentSegmentDropdown] = useState(false)
  const [parentSegmentSearch, setParentSegmentSearch] = useState('')
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  // Defer logging to avoid setState-during-render warnings
  useEffect(() => {
    console.log('🎯 Layout component rendered');
    console.log('📊 Layout state:', {
      pathname: location.pathname,
      parentSegmentsCount: parentSegments.length,
      selectedParentSegment,
      isLoadingParentSegments,
      parentSegmentError,
    });
  }, [location.pathname, parentSegments.length, selectedParentSegment, isLoadingParentSegments, parentSegmentError]);

  const filteredParentSegments = useMemo(() => {
    if (!parentSegmentSearch.trim()) return parentSegments
    const query = parentSegmentSearch.toLowerCase()
    return parentSegments.filter(s => s.name.toLowerCase().includes(query))
  }, [parentSegments, parentSegmentSearch])

  // Fetch parent segments from Treasure Data on mount
  useEffect(() => {
    console.log('🔄 Layout mounted - fetching parent segments...');
    try {
      fetchParentSegments()
    } catch (error) {
      console.error('❌ Error fetching parent segments:', error);
    }
  }, [fetchParentSegments])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showParentSegmentDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.parent-segment-dropdown-container')) {
          setShowParentSegmentDropdown(false)
          setParentSegmentSearch('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showParentSegmentDropdown])

  // Handle Home click - always reset chat by navigating with a new state
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/campaign-chat', { state: { resetId: Date.now() } })
  }

  const handleParentSegmentSelect = (segmentId: string) => {
    storeSelectParentSegment(segmentId)
    setShowParentSegmentDropdown(false)
  }

  const getSelectedSegmentName = () => {
    const segment = parentSegments.find(s => s.id === selectedParentSegment)
    return segment?.name || 'Select Parent Segment'
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Icon-only Sidebar */}
      <aside className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-4">
        {/* Logo - draggable area for macOS traffic lights */}
        <div className="mb-8 window-drag">
          <img src="/td-icon.svg" alt="Logo" className="w-12 h-12" />
        </div>

        {/* Main nav */}
        <nav className="flex-1 flex flex-col items-center space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              title={item.label}
              className="group w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-default"
            >
              {item.icon}
            </button>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="flex flex-col items-center space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`group w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
            </Link>
          ))}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm mt-2">
            A
          </div>
        </div>
      </aside>

      {/* Main content area with top nav */}
      <div
        className="flex-1 flex flex-col overflow-hidden noise-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 80% at -10% 100%, rgba(248,180,160,0.7) 0%, rgba(248,180,160,0.3) 40%, rgba(248,180,160,0) 70%),
            radial-gradient(ellipse 70% 90% at 110% 100%, rgba(120,220,232,0.6) 0%, rgba(120,220,232,0.3) 40%, rgba(120,220,232,0) 70%),
            linear-gradient(135deg, #fdf4f0 0%, #f9f9f9 40%, #f4fafa 60%, #eefbfb 100%)
          `
        }}
      >
        {/* Top Navigation Bar - draggable for window movement */}
        <div className="h-14 px-6 flex items-center flex-shrink-0 relative z-30 window-drag" style={{ overflow: 'visible' }}>
          {/* Left - Parent Segment */}
          <div className="flex items-center gap-2 relative parent-segment-dropdown-container window-no-drag">
            <button
              ref={dropdownTriggerRef}
              onClick={() => {
                if (!showParentSegmentDropdown && dropdownTriggerRef.current) {
                  const rect = dropdownTriggerRef.current.getBoundingClientRect()
                  setDropdownPos({ top: rect.bottom + 8, left: rect.left })
                }
                setShowParentSegmentDropdown(!showParentSegmentDropdown)
              }}
              disabled={isLoadingParentSegments}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 backdrop-blur-sm bg-white/10 border border-white/60 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:bg-white/40 hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.06)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingParentSegments ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : parentSegmentError ? (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-600">Error loading</span>
                </>
              ) : (
                <>
                  <span>{getSelectedSegmentName()}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown menu - rendered via portal to escape overflow-hidden */}
            {showParentSegmentDropdown && !isLoadingParentSegments && !parentSegmentError && createPortal(
              <div
                className="fixed w-80 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col parent-segment-dropdown-container"
                style={{ top: dropdownPos.top, left: dropdownPos.left, maxHeight: 'calc(100vh - 80px)', zIndex: 9999 }}
              >
                {/* Search input */}
                <div className="p-2 border-b border-gray-100 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search segments..."
                    value={parentSegmentSearch}
                    onChange={(e) => setParentSegmentSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                {filteredParentSegments.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {parentSegments.length === 0 ? 'No parent segments found' : 'No matching segments'}
                  </div>
                ) : (
                  <div className="py-1 overflow-y-auto flex-1">
                    {filteredParentSegments.map((segment) => (
                      <button
                        key={segment.id}
                        onClick={() => {
                          handleParentSegmentSelect(segment.id)
                          setParentSegmentSearch('')
                        }}
                        className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${selectedParentSegment === segment.id ? 'bg-blue-500' : 'bg-transparent border-2 border-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{segment.name}</div>
                          {segment.count && (
                            <div className="text-xs text-gray-500 mt-0.5">({segment.count} records)</div>
                          )}
                          {segment.masterTable && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{segment.masterTable}</div>
                          )}
                          {segment.description && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">{segment.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>,
              document.body
            )}

            {/* Error tooltip */}
            {parentSegmentError && showParentSegmentDropdown && createPortal(
              <div
                className="fixed w-72 bg-white rounded-xl shadow-lg border border-red-200 p-4 parent-segment-dropdown-container"
                style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
              >
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900">Failed to load parent segments</div>
                    <div className="text-xs text-red-700 mt-1">{parentSegmentError}</div>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Center - Main Navigation */}
          <div className="flex-1 flex items-center justify-center gap-1 window-no-drag">
            {topNavItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/campaign-chat' && location.pathname.startsWith(item.path))

              return item.isIcon ? (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={item.path === '/campaign-chat' ? handleHomeClick : undefined}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                </Link>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right - Spacer to balance layout */}
          <div className="w-32"></div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
