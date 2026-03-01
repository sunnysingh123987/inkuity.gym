/**
 * SVG icon path utilities for mapping exercise names, categories,
 * and equipment to their corresponding SVG files in /public/svgs/
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCategorySvg(category: string): string {
  return `/svgs/categories/${slugify(category)}.svg`;
}

export function getExerciseSvg(exerciseName: string): string {
  return `/svgs/exercises/${slugify(exerciseName)}.svg`;
}

export function getEquipmentSvg(equipment: string): string {
  return `/svgs/equipment/${slugify(equipment)}.svg`;
}

export function getUiSvg(name: string): string {
  return `/svgs/ui/${slugify(name)}.svg`;
}

/** Reusable className for SVG icon images to inherit parent text color via CSS filter */
export const svgIconClass = 'inline-block dark:invert';
