'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  Tag,
} from 'lucide-react'

type NoteType = 'general' | 'meeting' | 'decision' | 'action_item'

interface TeamNote {
  id: string
  team: string
  title: string
  content: string
  note_type: NoteType
  meeting_date: string | null
  attendees: string[] | null
  assigned_to: string | null
  assigned_to_name?: string
  due_date: string | null
  is_completed: boolean
  tags: string[] | null
  created_by: string
  created_by_name: string
  created_at: string
}

const NOTE_TYPES: { value: NoteType; label: string; icon: string }[] = [
  { value: 'general', label: 'General Note', icon: '📝' },
  { value: 'meeting', label: 'Meeting Notes', icon: '👥' },
  { value: 'decision', label: 'Decision', icon: '⚖️' },
  { value: 'action_item', label: 'Action Item', icon: '✅' },
]

const TEAM_DISPLAY_NAMES: Record<string, string> = {
  bsg: 'Business Services',
  audit: 'Audit',
  tax: 'Tax',
  corporate_finance: 'Corporate Finance',
  bookkeeping: 'Bookkeeping',
  admin: 'Admin',
}

export default function TeamNotesPage() {
  const supabase = createClient()
  const [notes, setNotes] = useState<TeamNote[]>([])
  const [loading, setLoading] = useState(true)
  const [userTeam, setUserTeam] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  
  // New note form
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'general' as NoteType,
    meeting_date: '',
    due_date: '',
    tags: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    // Get user's team
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('team')
      .eq('id', user.id)
      .single()

    if (!profile) {
      setError('Profile not found')
      setLoading(false)
      return
    }

    setUserTeam(profile.team)

    // Fetch notes for team
    const { data: notesData, error: notesError } = await supabase
      .from('team_notes')
      .select('*')
      .eq('team', profile.team)
      .order('created_at', { ascending: false })

    if (notesError) {
      setError('Failed to load notes')
      setLoading(false)
      return
    }

    setNotes(notesData || [])
    setLoading(false)
  }

  async function createNote() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !userTeam) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const { error: insertError } = await supabase
      .from('team_notes')
      .insert({
        team: userTeam,
        title: newNote.title,
        content: newNote.content,
        note_type: newNote.note_type,
        meeting_date: newNote.meeting_date || null,
        due_date: newNote.due_date || null,
        tags: newNote.tags ? newNote.tags.split(',').map(t => t.trim()).filter(t => t) : null,
        created_by: user.id,
        created_by_name: profile?.full_name || user.email,
      })

    if (insertError) {
      setError('Failed to create note: ' + insertError.message)
      setSaving(false)
      return
    }

    setShowNewNote(false)
    setNewNote({
      title: '',
      content: '',
      note_type: 'general',
      meeting_date: '',
      due_date: '',
      tags: '',
    })
    setSaving(false)
    fetchData()
  }

  async function toggleComplete(noteId: string, currentValue: boolean) {
    const { error: updateError } = await supabase
      .from('team_notes')
      .update({
        is_completed: !currentValue,
        completed_at: !currentValue ? new Date().toISOString() : null,
      })
      .eq('id', noteId)

    if (!updateError) {
      fetchData()
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return

    const { error: deleteError } = await supabase
      .from('team_notes')
      .delete()
      .eq('id', noteId)

    if (!deleteError) {
      fetchData()
    }
  }

  const filteredNotes = notes.filter(note => {
    if (typeFilter !== 'all' && note.note_type !== typeFilter) return false
    if (!showCompleted && note.is_completed) return false
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-implementation-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Team Notes</h1>
            <p className="text-surface-600 mt-1">
              {userTeam ? `${TEAM_DISPLAY_NAMES[userTeam] || userTeam} Team` : 'Your Team'} - Private notes and meeting records
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewNote(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* New Note Form */}
      {showNewNote && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">New Note</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Title</label>
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="input-field"
                placeholder="Note title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Type</label>
              <select
                value={newNote.note_type}
                onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as NoteType })}
                className="input-field"
              >
                {NOTE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">Content</label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={6}
              className="input-field"
              placeholder="Note content... (Markdown supported)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {newNote.note_type === 'meeting' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Meeting Date</label>
                <input
                  type="date"
                  value={newNote.meeting_date}
                  onChange={(e) => setNewNote({ ...newNote, meeting_date: e.target.value })}
                  className="input-field"
                />
              </div>
            )}
            
            {newNote.note_type === 'action_item' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newNote.due_date}
                  onChange={(e) => setNewNote({ ...newNote, due_date: e.target.value })}
                  className="input-field"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                className="input-field"
                placeholder="ai, copilot, automation"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowNewNote(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={createNote}
              disabled={saving || !newNote.title || !newNote.content}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              {NOTE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-implementation-500 focus:ring-implementation-500"
            />
            <span className="ml-2 text-sm text-surface-700">Show completed</span>
          </label>
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 text-center">
          <FileText className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500">
            {notes.length === 0 
              ? 'No notes yet. Create your first note to get started.'
              : 'No notes match your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`bg-white rounded-2xl border border-surface-100 shadow-sm p-6 ${
                note.is_completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {NOTE_TYPES.find(t => t.value === note.note_type)?.icon || '📝'}
                  </span>
                  <div>
                    <h3 className={`font-display font-semibold text-surface-900 ${note.is_completed ? 'line-through' : ''}`}>
                      {note.title}
                    </h3>
                    <p className="text-sm text-surface-500">
                      {note.created_by_name} • {formatDate(note.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {note.note_type === 'action_item' && (
                    <button
                      onClick={() => toggleComplete(note.id, note.is_completed)}
                      className={`px-3 py-1 text-sm rounded-lg font-medium ${
                        note.is_completed 
                          ? 'bg-surface-100 text-surface-600' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {note.is_completed ? 'Completed' : 'Mark Complete'}
                    </button>
                  )}
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="prose prose-sm max-w-none mb-3">
                <p className="whitespace-pre-wrap text-surface-700">{note.content}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {note.meeting_date && (
                  <span className="text-surface-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Meeting: {formatDate(note.meeting_date)}
                  </span>
                )}
                {note.due_date && (
                  <span className={`flex items-center gap-1 ${
                    new Date(note.due_date) < new Date() && !note.is_completed
                      ? 'text-red-600 font-medium'
                      : 'text-surface-600'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    Due: {formatDate(note.due_date)}
                  </span>
                )}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 items-center">
                    <Tag className="w-4 h-4 text-surface-400" />
                    {note.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-surface-100 rounded text-surface-600 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

