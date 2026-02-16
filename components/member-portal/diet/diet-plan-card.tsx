'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Apple,
  Flame,
  Target,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DietPlanCardProps {
  plan: any;
  gymSlug: string;
  onDelete?: (planId: string) => void;
}

export function DietPlanCard({ plan, gymSlug, onDelete }: DietPlanCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ongoing';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isActive = plan.is_active;
  const startDate = formatDate(plan.start_date);
  const endDate = formatDate(plan.end_date);

  return (
    <Card className={isActive ? 'border-indigo-200 bg-indigo-50/30' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              {isActive && (
                <Badge className="bg-indigo-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            {plan.description && (
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/${gymSlug}/portal/diet/${plan.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Plan
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(plan.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Plan
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Macros Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Flame className="h-4 w-4" />
                <span className="text-xs font-medium">Calories</span>
              </div>
              <p className="text-lg font-bold">
                {plan.target_calories || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Protein</span>
              </div>
              <p className="text-lg font-bold">{plan.target_protein || 0}g</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Carbs</span>
              </div>
              <p className="text-lg font-bold">{plan.target_carbs || 0}g</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Fat</span>
              </div>
              <p className="text-lg font-bold">{plan.target_fat || 0}g</p>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {startDate} - {endDate}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/${gymSlug}/portal/diet/${plan.id}/meals`}>
                <Apple className="h-4 w-4 mr-2" />
                View Meals
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/${gymSlug}/portal/diet/${plan.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Plan
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
