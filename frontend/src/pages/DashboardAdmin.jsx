import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, Activity, CreditCard, TrendingUp, Clock,
  RefreshCw, ChevronRight, CheckCircle2, XCircle, LayoutDashboard,
} from 'lucide-react'
import { dashboardApi } from '../api/dashboard'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316']

const STATUS_CLS = {
  PENDING:  'bg-amber-100 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border border-red-200',
}

function KpiCard({ label, value, sub, Icon, gradient }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-5 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${gradient}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 truncate">{label}</p>
        <p className="text-4xl font-black tracking-tight text-slate-900 mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-blue-300">{payload[0].value} inscription(s)</p>
    </div>
  )
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="font-semibold mb-1">{name}</p>
      <p className="text-blue-300">{value} inscription(s)</p>
    </div>
  )
}

export default function DashboardAdmin() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, c, p] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.charts(),
        dashboardApi.pending(),
      ])
      setStats(s)
      setCharts(c)
      setPending(p)
    } catch {
      toast.error(t('dash_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">{t('dash_loading')}</span>
        </div>
      </div>
    )
  }

  const barData = charts?.registrationsByMonth ?? []
  const pieData = (charts?.breakdownByType ?? []).map(d => ({ name: d.name, value: d.value }))
  const approvalRate = stats?.approvalRate != null ? `${stats.approvalRate.toFixed(0)} %` : '—'

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('dash_title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('dash_subtitle')}</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t('dash_refresh')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label={t('dash_kpi_activities')}
          value={stats?.totalActivities}
          sub={`${stats?.pendingActivities ?? 0} ${t('dash_kpi_pending')}`}
          Icon={Activity}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <KpiCard
          label={t('dash_kpi_registrations')}
          value={stats?.totalRegistrations}
          sub={`${stats?.pendingRegistrations ?? 0} ${t('dash_kpi_pending')}`}
          Icon={Users}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
        />
        <KpiCard
          label={t('dash_kpi_tickets')}
          value={stats?.totalTickets}
          sub={`${stats?.pendingTickets ?? 0} ${t('dash_kpi_pending')}`}
          Icon={CreditCard}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <KpiCard
          label={t('dash_kpi_approval')}
          value={approvalRate}
          sub=""
          Icon={TrendingUp}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <ChartCard title={t('dash_chart_monthly')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard title={t('dash_chart_types')}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{t('dash_pending_title')}</h2>
            {((pending?.totalPending ?? 0) > 0) && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {pending.totalPending}
              </span>
            )}
          </div>
        </div>

        {(!pending || pending.totalPending === 0) ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            <p className="text-sm font-medium">{t('dash_pending_empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(pending.pendingRegistrations > 0) && (
              <div className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{t('dash_kpi_registrations')}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {pending.pendingRegistrations} {t('dash_registrations')} {t('dash_kpi_pending')}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS.PENDING}`}>
                    {t('status_pending')}
                  </span>
                  <Link to="/admin/registrations" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    {t('dash_see_all')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
            {(pending.pendingTickets > 0) && (
              <div className="flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{t('dash_kpi_tickets')}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {pending.pendingTickets} {t('dash_tickets_pending')} {t('dash_kpi_pending')}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS.PENDING}`}>
                    {t('status_pending')}
                  </span>
                  <Link to="/admin/tickets" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    {t('dash_see_all')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top popular activities list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-wide">
            {t('dash_top_activities')}
          </h3>
          {(charts?.topActivities?.length === 0 || !charts?.topActivities) ? (
            <div className="text-sm text-slate-400 py-6 text-center">{t('dash_pending_empty')}</div>
          ) : (
            <div className="space-y-4">
              {charts.topActivities.map((act, index) => {
                const maxCount = Math.max(...charts.topActivities.map(a => a.count), 1);
                const percent = (act.count / maxCount) * 100;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 truncate max-w-[80%]">{act.title}</span>
                      <span className="text-slate-500 font-bold">{act.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status distribution breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            {t('dash_status_breakdown')}
          </h3>

          {/* Inscriptions status breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dash_inscriptions_breakdown')}</h4>
            <div className="grid grid-cols-3 gap-3">
              {['PENDING', 'APPROVED', 'REJECTED'].map((st) => {
                const count = stats?.inscriptionsByStatus?.[st] ?? 0;
                const total = stats?.totalInscriptions ?? 1;
                const pct = stats?.totalInscriptions ? ((count / total) * 100).toFixed(0) : 0;
                const borderCls = st === 'PENDING' ? 'border-amber-200 bg-amber-50/30' : st === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30';
                const textCls = st === 'PENDING' ? 'text-amber-700' : st === 'APPROVED' ? 'text-emerald-700' : 'text-red-700';
                return (
                  <div key={st} className={`border rounded-xl p-3 text-center ${borderCls}`}>
                    <p className={`text-lg font-black ${textCls}`}>{count}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{t(st === 'PENDING' ? 'status_pending' : st === 'APPROVED' ? 'status_approved' : 'status_rejected')}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tickets status breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dash_tickets_breakdown')}</h4>
            <div className="grid grid-cols-3 gap-3">
              {['PENDING', 'APPROVED', 'REJECTED'].map((st) => {
                const count = stats?.ticketsByStatus?.[st] ?? 0;
                const total = stats?.totalTickets ?? 1;
                const pct = stats?.totalTickets ? ((count / total) * 100).toFixed(0) : 0;
                const borderCls = st === 'PENDING' ? 'border-amber-200 bg-amber-50/30' : st === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30';
                const textCls = st === 'PENDING' ? 'text-amber-700' : st === 'APPROVED' ? 'text-emerald-700' : 'text-red-700';
                return (
                  <div key={st} className={`border rounded-xl p-3 text-center ${borderCls}`}>
                    <p className={`text-lg font-black ${textCls}`}>{count}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{t(st === 'PENDING' ? 'status_pending' : st === 'APPROVED' ? 'status_approved' : 'status_rejected')}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
