import React, { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Bell, CheckSquare, Inbox, ShieldAlert } from 'lucide-react'
import { notificationsApi } from '../../api/notifications'
import { useWebSocket } from '../../hooks/useWebSocket'

const TYPE_ICONS = {
  INFO:    'ℹ️',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR:   '🚨',
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [open,          setOpen]          = useState(false)
  const dropdownRef = useRef(null)

  const load = () => {
    notificationsApi.me({ page: 0, size: 5 })
      .then(res => {
        // Axios client returns response.data directly.
        // Our controller returns a Map containing "notifications" and "unreadCount"
        setNotifications(res.notifications?.content || [])
        setUnreadCount(res.unreadCount || 0)
      })
      .catch(() => {})
  }

  // Hook up WebSocket for real-time notification pushes
  useWebSocket((newNotif) => {
    // Play a gentle notification sound or show a toast
    toast(newNotif.titre + ': ' + newNotif.message, {
      icon: TYPE_ICONS[newNotif.type] || '🔔',
      style: { borderRadius: '12px', background: '#333', color: '#fff' }
    })
    
    // Add to the local list and increment unread count
    setNotifications(prev => [newNotif, ...prev.slice(0, 4)])
    setUnreadCount(prev => prev + 1)
  })

  useEffect(() => {
    load()

    // Handle clicking outside to close the dropdown
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const markRead = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationsApi.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await notificationsApi.markAll()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('Tout a été marqué comme lu.')
    } catch {}
  }

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900"
        title="Notifications"
        id="btn-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown container */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border shadow-xl overflow-hidden z-50 divide-y divide-slate-100">
          
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
            <span className="font-semibold text-slate-800 text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <Inbox className="w-8 h-8 text-slate-200" />
                <p className="text-xs">Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => !n.isRead && markRead(n.id, e)}
                  className={`px-4 py-3 text-left transition-colors cursor-pointer flex gap-3 items-start
                    ${n.isRead ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs text-slate-900 truncate ${!n.isRead ? 'font-bold' : ''}`}>
                      {n.titre}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => markRead(n.id, e)}
                      className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2"
                      title="Marquer comme lu"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 text-center bg-slate-50">
            <span className="text-[10px] text-slate-400">
              Mises à jour en temps réel via WebSockets
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
