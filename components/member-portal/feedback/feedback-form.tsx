'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { respondToFeedback } from '@/lib/actions/reviews';
import type { FeedbackRequest } from '@/types/database';

interface FeedbackFormProps {
  feedbackRequest: FeedbackRequest;
}

export function FeedbackForm({ feedbackRequest }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await respondToFeedback(feedbackRequest.id, {
        response_text: responseText,
        response_rating: rating,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Thank you for your feedback! Your response has been recorded.',
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Something went wrong.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayRating = hoveredRating || rating;

  if (message?.type === 'success') {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <div className="rounded-lg px-4 py-3 text-sm bg-green-500/10 text-green-400 border border-green-500/20">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Share Your Feedback</h2>
          <p className="text-sm text-slate-400 mt-1">
            We&apos;d love to hear about your experience. Your feedback helps us improve.
          </p>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            How was your overall experience?
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= displayRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-transparent text-slate-600'
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm text-slate-400">
                {displayRating} / 5
              </span>
            )}
          </div>
        </div>

        {/* Response Text */}
        <div>
          <label
            htmlFor="feedback-text"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Tell us more (optional)
          </label>
          <textarea
            id="feedback-text"
            rows={4}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="What did you like? What could we improve?"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan-500 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500 resize-none"
          />
        </div>

        {/* Error Message */}
        {message && (
          <div className="rounded-lg px-4 py-3 text-sm bg-red-500/10 text-red-400 border border-red-500/20">
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full rounded-lg bg-brand-cyan-500 hover:bg-brand-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}
