import { ExpenseTracker } from './components/expense-tracker'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <>
      <ExpenseTracker />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
