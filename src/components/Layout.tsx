import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

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
  { path: '/campaign-chat', label: 'Plan Campaign', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )},
  { path: '/unified', label: 'Unified View', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM3 14h7v7H3v-7zM14 14h7v7h-7v-7z" />
    </svg>
  )},
  { path: '/chat-history', label: 'Chat History', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  // Defer logging to avoid setState-during-render warnings
  useEffect(() => {
    console.log('🎯 Layout component rendered');
    console.log('📊 Layout state:', {
      pathname: location.pathname,
    });
  }, [location.pathname]);

  // Handle Home click - always reset chat by navigating with a new state
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate('/campaign-chat', { state: { resetId: Date.now() } })
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
          background: `url('/bg-gradient.svg') center/cover no-repeat`
        }}
      >
        {/* Top Navigation Bar - draggable for window movement */}
        <div className="h-14 px-6 flex items-center flex-shrink-0 relative z-30 window-drag" style={{ overflow: 'visible' }}>
          {/* Main Navigation */}
          <div className="flex-1 flex items-center gap-1 window-no-drag">
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
