import type{ ReviewRating } from "../../../generated/prisma/enums"

export interface IReviewRating {
    note?: string
    reviewRating ?: ReviewRating
}