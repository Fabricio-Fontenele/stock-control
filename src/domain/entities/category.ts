export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ensureCategoryName = (value: string): string => {
  const name = value.trim();

  if (!name) {
    throw new Error("Category name is required");
  }

  return name;
};
