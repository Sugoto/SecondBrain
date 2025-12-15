import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Transaction } from '../lib/supabase'

// Demo data shown when Supabase is not configured
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', amount: 258.30, merchant: 'Eternal Limited', date: '2025-12-15', time: '11:06:29', type: 'expense', account: 'XX1232', upi_ref: '534982298858', category: null, created_at: '' },
  { id: '2', amount: 450.00, merchant: 'Swiggy', date: '2025-12-14', time: '19:30:00', type: 'expense', account: 'XX1232', upi_ref: '534982298859', category: 'food', created_at: '' },
  { id: '3', amount: 1200.00, merchant: 'Amazon', date: '2025-12-13', time: '14:22:00', type: 'expense', account: 'XX1232', upi_ref: '534982298860', category: 'shopping', created_at: '' },
  { id: '4', amount: 89.00, merchant: 'Zomato', date: '2025-12-12', time: '20:15:00', type: 'expense', account: 'XX1232', upi_ref: '534982298861', category: 'food', created_at: '' },
  { id: '5', amount: 500.00, merchant: 'Uber', date: '2025-12-11', time: '09:45:00', type: 'expense', account: 'XX1232', upi_ref: '534982298862', category: 'transport', created_at: '' },
]

export function BudgetTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setTransactions(DEMO_TRANSACTIONS)
      setIsDemo(true)
      setLoading(false)
      return
    }
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(100)

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-400 font-medium">🔧 Demo Mode</p>
            <p className="text-amber-400/80 text-sm mt-1">
              Supabase not configured. Create a <code className="font-mono bg-background px-1.5 py-0.5 rounded">.env</code> file with your credentials to see real data.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-expense/10 border border-expense/30 rounded-xl p-4 mb-6">
            <p className="text-expense font-medium">Error loading transactions</p>
            <p className="text-expense/80 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Budget Tracker
          </h1>
          <p className="text-text-muted mt-1">
            December 2025
          </p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
              Total Spent
            </p>
            <p className="text-2xl font-bold text-expense">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-text-muted text-sm uppercase tracking-wide mb-1">
              Total Income
            </p>
            <p className="text-2xl font-bold text-income">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            {!isDemo && (
              <button
                onClick={fetchTransactions}
                className="text-sm text-primary hover:text-primary-dim transition-colors"
              >
                Refresh
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <p className="text-text-muted">No transactions yet</p>
              <p className="text-text-muted text-sm mt-2">
                Run your Google Apps Script to sync transactions from Gmail
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {txn.merchant || 'Unknown'}
                      </p>
                      <p className="text-text-muted text-sm">
                        {formatDate(txn.date)}
                        {txn.time && ` • ${txn.time.slice(0, 5)}`}
                        {txn.account && ` • ${txn.account}`}
                      </p>
                    </div>
                    <p
                      className={`font-mono font-semibold ml-4 ${
                        txn.type === 'expense' ? 'text-expense' : 'text-income'
                      }`}
                    >
                      {txn.type === 'expense' ? '-' : '+'}
                      {formatCurrency(txn.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center text-text-muted text-sm">
          <p>
            {transactions.length} transactions {isDemo ? '(demo data)' : 'synced from Gmail'}
          </p>
        </footer>
      </div>
    </div>
  )
}
