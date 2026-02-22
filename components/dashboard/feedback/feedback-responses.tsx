'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, Clock } from 'lucide-react'
import type { FeedbackRequestWithMember } from '@/types/database'

interface FeedbackResponsesProps {
  feedbackRequests: FeedbackRequestWithMember[]
}

export function FeedbackResponses({ feedbackRequests }: FeedbackResponsesProps) {
  if (feedbackRequests.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Feedback Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No feedback requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send feedback requests to inactive members from the Members page.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/10">
            Sent
          </Badge>
        )
      case 'responded':
        return (
          <Badge className="bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20 hover:bg-green-500/10">
            Responded
          </Badge>
        )
      case 'expired':
        return (
          <Badge className="bg-muted text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted">
            Expired
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Feedback Responses</CardTitle>
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
            {feedbackRequests.filter(f => f.status === 'responded').length}/{feedbackRequests.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {feedbackRequests.map((feedback) => {
            const name = feedback.member?.full_name || feedback.member?.email || 'Unknown'
            const initial = name[0].toUpperCase()
            const sentDate = new Date(feedback.sent_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })

            return (
              <div key={feedback.id} className="py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-cyan-500/10 text-sm font-medium text-brand-cyan-400">
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Sent {sentDate}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(feedback.status)}
                </div>

                {feedback.status === 'responded' && (
                  <div className="ml-11 mt-2">
                    {feedback.response_rating && (
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= feedback.response_rating!
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-transparent text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {feedback.response_text && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {feedback.response_text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
