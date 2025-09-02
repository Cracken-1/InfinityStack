import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface CollaborationSession {
  id: string
  tenantId: string
  resourceType: string
  resourceId: string
  participants: Participant[]
  createdAt: Date
}

export interface Participant {
  userId: string
  userName: string
  cursor?: { x: number; y: number }
  selection?: { start: number; end: number }
  lastSeen: Date
}

export interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'edit' | 'comment' | 'join' | 'leave'
  userId: string
  data: Record<string, any>
  timestamp: Date
}

class CollaborationEngine {
  private supabase = supabaseAdmin
  private sessions = new Map<string, CollaborationSession>()

  async joinSession(tenantId: string, resourceType: string, resourceId: string, userId: string, userName: string): Promise<string> {
    const sessionId = `${tenantId}-${resourceType}-${resourceId}`
    
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = {
        id: sessionId,
        tenantId,
        resourceType,
        resourceId,
        participants: [],
        createdAt: new Date()
      }
      this.sessions.set(sessionId, session)
    }

    const existingParticipant = session.participants.find(p => p.userId === userId)
    if (!existingParticipant) {
      session.participants.push({
        userId,
        userName,
        lastSeen: new Date()
      })
      
      await this.broadcastEvent(sessionId, {
        type: 'join',
        userId,
        data: { userName },
        timestamp: new Date()
      })
    }

    return sessionId
  }

  async leaveSession(sessionId: string, userId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.participants = session.participants.filter(p => p.userId !== userId)
    
    await this.broadcastEvent(sessionId, {
      type: 'leave',
      userId,
      data: {},
      timestamp: new Date()
    })

    if (session.participants.length === 0) {
      this.sessions.delete(sessionId)
    }
  }

  async updateCursor(sessionId: string, userId: string, cursor: { x: number; y: number }) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const participant = session.participants.find(p => p.userId === userId)
    if (participant) {
      participant.cursor = cursor
      participant.lastSeen = new Date()
      
      await this.broadcastEvent(sessionId, {
        type: 'cursor',
        userId,
        data: { cursor },
        timestamp: new Date()
      })
    }
  }

  async updateSelection(sessionId: string, userId: string, selection: { start: number; end: number }) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const participant = session.participants.find(p => p.userId === userId)
    if (participant) {
      participant.selection = selection
      participant.lastSeen = new Date()
      
      await this.broadcastEvent(sessionId, {
        type: 'selection',
        userId,
        data: { selection },
        timestamp: new Date()
      })
    }
  }

  async broadcastEdit(sessionId: string, userId: string, operation: Record<string, any>) {
    await this.broadcastEvent(sessionId, {
      type: 'edit',
      userId,
      data: { operation },
      timestamp: new Date()
    })
  }

  async addComment(sessionId: string, userId: string, comment: string, position?: { x: number; y: number }) {
    const commentId = crypto.randomUUID()
    
    await this.supabase
      .from('collaboration_comments')
      .insert({
        id: commentId,
        session_id: sessionId,
        user_id: userId,
        comment,
        position,
        created_at: new Date()
      })

    await this.broadcastEvent(sessionId, {
      type: 'comment',
      userId,
      data: { commentId, comment, position },
      timestamp: new Date()
    })
  }

  async getSessionParticipants(sessionId: string): Promise<Participant[]> {
    const session = this.sessions.get(sessionId)
    return session?.participants || []
  }

  async getComments(sessionId: string) {
    const { data } = await this.supabase
      .from('collaboration_comments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    return data || []
  }

  private async broadcastEvent(sessionId: string, event: CollaborationEvent) {
    try {
      await this.supabase
        .from('collaboration_events')
        .insert({
          session_id: sessionId,
          event_type: event.type,
          user_id: event.userId,
          event_data: event.data,
          created_at: event.timestamp
        })

      // Real-time broadcast via Supabase realtime
      await this.supabase.channel(`collaboration:${sessionId}`)
        .send({
          type: 'broadcast',
          event: 'collaboration_event',
          payload: event
        })
    } catch (error) {
      logger.error('Collaboration broadcast error:', error as Error)
    }
  }

  // Operational Transform for conflict resolution
  transformOperation(op1: any, op2: any): any {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return { ...op2, position: op2.position + op1.text.length }
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position < op2.position) {
        return { ...op2, position: op2.position - op1.length }
      }
    }
    
    return op2
  }
}

export const collaboration = new CollaborationEngine()

// Real-time subscription helper
export function subscribeToCollaboration(sessionId: string, onEvent: (event: CollaborationEvent) => void) {
  return supabaseAdmin
    .channel(`collaboration:${sessionId}`)
    .on('broadcast', { event: 'collaboration_event' }, ({ payload }: { payload: any }) => {
      onEvent(payload as CollaborationEvent)
    })
    .subscribe()
}