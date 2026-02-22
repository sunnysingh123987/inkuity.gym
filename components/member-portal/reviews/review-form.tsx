'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { createReview, updateReview } from '@/lib/actions/reviews';
import type { GymReview } from '@/types/database';

interface ReviewFormProps {
  gymId: string;
  memberId: string;
  existingReview?: GymReview | null;
}

export function ReviewForm({ gymId, memberId, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
  const [isPublic, setIsPublic] = useState(existingReview?.is_public ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEditing = !!existingReview;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      let result;

      if (isEditing && existingReview) {
        result = await updateReview(existingReview.id, {
          rating,
          review_text: reviewText || undefined,
          is_public: isPublic,
        });
      } else {
        result = await createReview({
          gym_id: gymId,
          member_id: memberId,
          rating,
          review_text: reviewText || undefined,
          is_public: isPublic,
        });
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: isEditing ? 'Your review has been updated!' : 'Thank you for your review!',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit Your Review' : 'Leave a Review'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isEditing
              ? 'Update your rating and feedback below.'
              : 'Share your experience with this gym.'}
          </p>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Rating
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

        {/* Review Text */}
        <div>
          <label
            htmlFor="review-text"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Your Review (optional)
          </label>
          <textarea
            id="review-text"
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-cyan-500 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500 resize-none"
          />
        </div>

        {/* Public Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is-public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand-cyan-500 focus:ring-brand-cyan-500 focus:ring-offset-0"
          />
          <label htmlFor="is-public" className="text-sm text-slate-300">
            Make this review public (visible on the gym page)
          </label>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full rounded-lg bg-brand-cyan-500 hover:bg-brand-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Submitting...'
            : isEditing
            ? 'Update Review'
            : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
