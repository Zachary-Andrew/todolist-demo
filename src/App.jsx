import { useState, useEffect, useCallback, useRef } from 'react'

export default function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return [
      { id: 1, text: 'Read a book', done: false },
      { id: 2, text: 'Go for a walk', done: true },
      { id: 3, text: 'Write some code', done: false },
    ]
  })
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const [deletedItem, setDeletedItem] = useState(null) // { todo, index }
  const timerRef = useRef(null)

  // Save to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos([...todos, { id: Date.now(), text, done: false, dueDate: null, priority: 'normal' }])
    setInput('')
  }

  const toggleTodo = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const commitDelete = useCallback(() => {
    clearTimeout(timerRef.current)
    setDeletedItem(null)
  }, [])

  const handleUndo = useCallback(() => {
    if (!deletedItem) return
    clearTimeout(timerRef.current)
    setTodos((prev) => {
      const next = [...prev]
      next.splice(deletedItem.index, 0, deletedItem.todo)
      return next
    })
    setDeletedItem(null)
  }, [deletedItem])

  const deleteTodo = useCallback((id) => {
    // Commit any pending undo first
    if (deletedItem) commitDelete()

    setTodos((prev) => {
      const index = prev.findIndex((t) => t.id === id)
      const todo = prev[index]

      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(commitDelete, 5000)

      setDeletedItem({ todo, index })
      return prev.filter((t) => t.id !== id)
    })
  }, [deletedItem, commitDelete])

  // Keyboard shortcut: Cmd/Ctrl+Z
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleUndo])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const visible = todos.filter((t) =>
    filter === 'active' ? !t.done : filter === 'completed' ? t.done : true,
  )

  const remaining = todos.filter((t) => !t.done).length

  const tabClass = (name) =>
    `px-3 py-1 rounded-md text-sm font-medium transition ${
      filter === name
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200'
    }`

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Todo List</h1>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs doing?"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={tabClass('all')}>
            All
          </button>
          <button onClick={() => setFilter('active')} className={tabClass('active')}>
            Active
          </button>
          <button onClick={() => setFilter('completed')} className={tabClass('completed')}>
            Completed
          </button>
        </div>

        {/* Screen reader live region */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {deletedItem ? `Deleted "${deletedItem.todo.text}". Press Ctrl+Z or click Undo to restore.` : ''}
        </div>

        <ul className="space-y-2">
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex-1 text-left ${
                  todo.done ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
              >
                {todo.text}
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-slate-400 hover:text-red-500 text-lg font-bold px-2"
                aria-label="Delete todo"
              >
                ×
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-center text-slate-400 py-4 text-sm">
              Nothing here.
            </li>
          )}
        </ul>

        <div className="mt-4 text-sm text-slate-500 flex justify-between items-center">
          <span>{remaining} {remaining === 1 ? 'item' : 'items'} left</span>
        </div>

        {/* Toast */}
        {deletedItem && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 text-sm">
            <span>Deleted "{deletedItem.todo.text}"</span>
            <button
              onClick={handleUndo}
              className="text-indigo-300 hover:text-indigo-200 font-medium underline"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
